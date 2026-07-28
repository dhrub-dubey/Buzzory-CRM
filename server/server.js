import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
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

// Store fresh Instagram image URLs temporarily
const imageCache = new Map();

app.post("/api/instagram", async (req, res) => {
    try {
       // const { instagramUrl } = req.body;

       const {
        instagramUrl,
        influencerId
       } = req.body;

        if (!instagramUrl) {
            return res.status(400).json({
                error: "Instagram URL required"
            });
        }

        const username = instagramUrl
            .trim()
            .replace("https://www.instagram.com/", "")
            .replace("https://instagram.com/", "")
            .replace("http://instagram.com/", "")
            .replace("http://www.instagram.com/", "")
            .replace(/\/$/, "");

        console.log("Fetching Instagram profile:", username);

        const run = await client.actor("dSCLg0C3YEZ83HzYX").call({
            usernames: [username],
            includeAboutSection: false,
        });

        console.log("RUN:");
        console.log(run);

        const { items } = await client
            .dataset(run.defaultDatasetId)
            .listItems();

        console.log("ITEMS:");
        console.dir(items, { depth: null });

        const profile = items[0];

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        console.log("PROFILE IMAGE FIELDS:");
        console.log("profilePicUrlHD:", profile.profilePicUrlHD);
        console.log("profilePicUrl:", profile.profilePicUrl);

        const originalImageUrl =
            profile.profilePicUrlHD ||
            profile.profilePicUrl;

        if (!originalImageUrl) {
            return res.status(404).json({
                error: "Profile picture not found"
            });
        }

        // Create a unique ID for this image
        const imageId = `${profile.username}-${Date.now()}`;

        // Store the fresh Instagram URL temporarily
        imageCache.set(imageId, originalImageUrl);

        console.log("IMAGE ID:", imageId);
        console.log("CACHED IMAGE URL:", originalImageUrl);

        // // This is YOUR server URL, not Instagram's CDN URL
        // const serverUrl = `http://localhost:${process.env.PORT || 5000}`;

        // const profilePhotoUrl =
        //     `${serverUrl}/api/instagram/image/${encodeURIComponent(imageId)}`;

        // Build the correct URL for both local development and production
        const serverUrl = `${req.protocol}://${req.get("host")}`;

        const profilePhotoUrl =
            `${serverUrl}/api/instagram/image/${encodeURIComponent(imageId)}`;

        console.log("PROFILE PHOTO URL SENT TO CRM:");
        console.log(profilePhotoUrl);

        // res.json({
        //     username: profile.username,
        //     followers: profile.followersCount,
        //     profile_photo: profilePhotoUrl
        // });

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
        
        res.json({
            success: true,
            username: profile.username,
            followers: profile.followersCount,
            profile_photo: profilePhotoUrl
        });

    } catch (err) {
        console.error("INSTAGRAM ERROR:", err.message);
        console.error(err);

        res.status(500).json({
            error: "Unable to fetch profile."
        });
    }
});


// Serve the actual profile image
app.get("/api/instagram/image/:imageId", async (req, res) => {
    try {
        const imageId = decodeURIComponent(req.params.imageId);

        console.log("IMAGE REQUEST RECEIVED:", imageId);

        const originalImageUrl = imageCache.get(imageId);

        if (!originalImageUrl) {
            return res.status(404).json({
                error: "Image not found or expired"
            });
        }

        console.log("FETCHING FRESH INSTAGRAM IMAGE:");
        console.log(originalImageUrl);

        const response = await axios.get(originalImageUrl, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.instagram.com/"
            }
        });

        const contentType =
            response.headers["content-type"] || "image/jpeg";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=3600");

        res.send(response.data);

    } catch (err) {
        console.error("IMAGE FETCH ERROR:", err.message);

        res.status(500).json({
            error: "Unable to load profile image"
        });
    }
});


app.post("/api/sync-instagram", async (req, res) => {
    try {

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

        for (const influencer of influencers) {

            if (!influencer.instagram) {
                skipped++;
                continue;
            }

            try {

                await axios.post(
                    `${req.protocol}://${req.get("host")}/api/instagram`,
                    {
                        instagramUrl: influencer.instagram,
                        influencerId: influencer.id
                    }
                );

                updated++;

                console.log(
                    `✓ ${influencer.full_name}`
                );

            } catch (err) {

                failed++;

                console.log(
                    `✗ ${influencer.full_name}`
                );

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