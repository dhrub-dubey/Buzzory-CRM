import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { ApifyClient } from "apify-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


if (process.env.RENDER) {
    dotenv.config();
} else {
    const envPath = path.resolve(__dirname, "../.env.local");

    console.log("Loading env from:", envPath);

    dotenv.config({
        path: envPath,
    });
}

const app = express();

app.use(cors());
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;

const BASE44_APP_ID = process.env.BASE44_APP_ID;
const BASE44_API_KEY = process.env.BASE44_API_KEY;

const BASE44_URL =
    `https://buzzory-crm.base44.app/api/apps/${BASE44_APP_ID}/entities/Influencer`;

const client = new ApifyClient({
    token: APIFY_TOKEN,
});

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const syncRequestLog = new Map();
const SYNC_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const SYNC_RATE_LIMIT_MAX_REQUESTS = 1;

async function syncInstagramProfile(instagramUrl, influencerId) {

    
    let username = "unknown";

    try {

    if (!instagramUrl) {
        throw new Error("Instagram URL required");
    }

         username = instagramUrl.trim();

        // Remove domain
        username = username.replace(
            /^https?:\/\/(www\.)?instagram\.com\//,
            ""
        );

        // Remove everything after ? (utm params, igsh, etc.)
        username = username.split("?")[0];

        // Remove trailing slash
        username = username.replace(/\/$/, "");

        console.log("Fetching Instagram profile:", username);

        const run = await client.actor("dSCLg0C3YEZ83HzYX").call({
            usernames: [username],
            includeAboutSection: false,
        });


        const { items } = await client
            .dataset(run.defaultDatasetId)
            .listItems();

        const profile = items[0];

        if (!profile) {
            throw new Error("Profile not found");
        }

        console.log({
            username: profile.username,
            fullName: profile.fullName,
            followers: profile.followersCount,
            following: profile.followsCount,
            posts: profile.postsCount,
            hasProfilePic: !!(profile.profilePicUrlHD || profile.profilePicUrl),
        });

        
    

        const originalImageUrl =
            profile.profilePicUrlHD ||
            profile.profilePicUrl;

        // Check first
        if (!originalImageUrl) {
            throw new Error("Profile picture not found");
        }

        // Only download if it exists
        const imageResponse = await axios.get(originalImageUrl, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0",
                Referer: "https://www.instagram.com/",
            },
        });

        const extension =
            imageResponse.headers["content-type"]?.includes("png")
                ? "png"
                : "jpg";

        // const filePath = `instagram/${profile.username}.${extension}`;

        const storageScope = influencerId || profile.username || "unlinked";
        const filePath = `instagram/${storageScope}/${profile.username}.${extension}`;

        const { error: uploadError } =
            await supabase.storage
                .from("influencer-pfps")
                .upload(
                    filePath,
                    imageResponse.data,
                    {
                        contentType:
                            imageResponse.headers["content-type"],
                        upsert: true,
                    }
                );

        if (uploadError) {
            throw uploadError;
        }

        const { data } =
            supabase.storage
                .from("influencer-pfps")
                .getPublicUrl(filePath);

        const profilePhotoUrl = data.publicUrl;

        if (influencerId) {

            await axios.put(
                `${BASE44_URL}/${influencerId}`,
                {
                    username: profile.username,
                    followers: profile.followersCount,
                    profile_photo: profilePhotoUrl
                },
                {
                    headers: {
                        api_key: BASE44_API_KEY
                    }
                }
            );
        
            console.log("Influencer updated in Base44");
        }
        
        return {
            success: true,
            username: profile.username,
            followers: profile.followersCount,
            profile_photo: profilePhotoUrl
        };

    } catch (err) {
        console.error(`INSTAGRAM ERROR (${username}):`, err.message);

        if (err.response?.data) {
            console.error(err.response.data);
        }

        throw err;
    }

}

app.post("/api/instagram", async (req, res) => { 

    try {

        const {
            instagramUrl,
            influencerId
        } = req.body;

        const result = await syncInstagramProfile(
            instagramUrl,
            influencerId
        );

        res.json(result);

    } catch (err) {

        res.status(500).json({
            error: err.message || "Unable to fetch profile."
        });

    }

});

const BATCH_SIZE = 20;

app.post("/api/sync-instagram", async (req, res) => {

    const authHeader = req.headers.authorization;

    // Allow internal/manual requests
    const isAutomatedRequest =
        authHeader === `Bearer ${process.env.SYNC_SECRET}`;

    const isManualRequest =
        req.headers["x-manual-sync"] === "true";

    if (!isAutomatedRequest && !isManualRequest) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }   

    try {


        const ip = (req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || req.socket.remoteAddress || "unknown").trim();
        const now = Date.now();
        const currentWindow = syncRequestLog.get(ip);

        if (currentWindow && now - currentWindow.startedAt < SYNC_RATE_LIMIT_WINDOW_MS) {
            if (currentWindow.count >= SYNC_RATE_LIMIT_MAX_REQUESTS) {
                return res.status(429).json({
                    error: "Too many sync requests. Please wait before retrying."
                });
            }

            currentWindow.count += 1;
        } else {
            syncRequestLog.set(ip, {
                startedAt: now,
                count: 1
            });
        }

        for (const [key, value] of syncRequestLog.entries()) {
            if (now - value.startedAt >= SYNC_RATE_LIMIT_WINDOW_MS) {
                syncRequestLog.delete(key);
            }
        }

        console.log("Starting Instagram sync...");

        // Get every influencer
        const response = await axios.get(BASE44_URL, {
            headers: {
                api_key: BASE44_API_KEY
            }
        });

        const influencers = response.data || [];

        console.log(`Found ${influencers.length} influencers`);

        let updated = 0;
        let skipped = 0;
        let failed = 0;
        let processed = 0;

        const totalBatches = Math.ceil(
            influencers.length / BATCH_SIZE
        );
        
        for (
            let batchIndex = 0;
            batchIndex < influencers.length;
            batchIndex += BATCH_SIZE
        ) {
            const batch = influencers.slice(
                batchIndex,
                batchIndex + BATCH_SIZE
            );
        
            console.log(
                `\n========== Batch ${
                    batchIndex / BATCH_SIZE + 1
                }/${totalBatches} (${batch.length} influencers) ==========\n`
            );
        
            await Promise.allSettled(
                batch.map(async (influencer) => {
        
                    // existing sync logic
                    if (!influencer.instagram) {
                                skipped++;
                                processed++;

                                console.log(
                                    `⏭ ${influencer.username || influencer.instagram || influencer.full_name} (${processed}/${influencers.length}) - No Instagram`
                                );
                                return;
                            }

                            try {

                                const result = await syncInstagramProfile(
                                    influencer.instagram,
                                    influencer.id
                                );
                                
                                updated++;
                                processed++;
                                
                                console.log(
                                    `✓ ${result.username} (${processed}/${influencers.length})`
                                );
                            
                            } catch (err) {
                            
                                failed++;
                                processed++;
                            
                                console.log(
                                    `✗ ${influencer.username || influencer.instagram || influencer.full_name} (${processed}/${influencers.length})`
                                );
                            
                            }
                
                })
            );
        
            console.log(
                `Batch Complete (${Math.min(batchIndex + BATCH_SIZE, influencers.length)}/${influencers.length})`
            );
        
            console.log(
                `Updated: ${updated} | Skipped: ${skipped} | Failed: ${failed}`
            );

            if (batchIndex + BATCH_SIZE < influencers.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        res.json({
            success: true,
            updated,
            skipped,
            failed
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Sync failed"
        });

    }
});


app.listen(process.env.PORT || 5000, () => {
    console.log(
        `Server running on port ${process.env.PORT || 5000}`
    );
});