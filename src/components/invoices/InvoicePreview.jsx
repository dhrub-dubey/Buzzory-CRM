import React from 'react';
import { Card } from '@/components/ui/card';

export default function InvoicePreview({ form, subtotal, total }) {
  return (
  //  <div className="sticky top-6">
  <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">Invoice Preview</h2>
      </div>
      {/* <Card className="p-6 border border-border/50 bg-white text-gray-900 text-xs"> */}
      <Card className="relative overflow-hidden p-6 border border-border/50 bg-white text-gray-900 text-xs">
      <img
          src="/invoice-watermark.png"
          className="absolute inset-0 m-auto w-64 opacity-[0.08] pointer-events-none"
      />
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold"><span className="text-gray-900">Buzz</span><span className="text-orange-500">ory</span></h3>
            <p className="text-[10px] text-gray-500">Influencer Marketing Agency</p>
            <div className="mt-2 text-[10px] text-gray-500 space-y-0.5">
              <p>Baragharia, Dhupguri,</p>
              <p>Jalpaiguri, West Bengal - 700016</p>
              <p>Email: buzzory@gmail.com</p>
              <p>Phone: +91 81709 13636</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
            <div className="mt-2 text-[10px] text-gray-500 space-y-0.5">
              <p>Invoice No : {form.invoice_number || 'INV-0000'}</p>
              <p>Invoice Date : {form.invoice_date || '-'}</p>
              <p>Due Date : {form.due_date || '-'}</p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="font-semibold text-[10px] text-gray-500 mb-1">Bill To:</p>
          <p className="font-bold text-sm">{form.client_name || 'Client Name'}</p>
          <p className="text-[10px] text-gray-500">{form.billing_address || 'Address'}</p>
          <p className="text-[10px] text-gray-500">Email: {form.client_email || '-'}</p>
          <p className="text-[10px] text-gray-500">Phone: {form.client_phone || '-'}</p>
        </div>

        {/* Items Table */}
        <table className="w-full mb-4">
          <thead>
            <tr className="bg-[hsl(222,47%,11%)] text-white">
              <th className="text-left p-2 text-[10px] rounded-tl">Item / Description</th>
              <th className="text-center p-2 text-[10px]">Qty</th>
              <th className="text-right p-2 text-[10px]">Rate (₹)</th>
              <th className="text-right p-2 text-[10px] rounded-tr">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {form.items.filter(i => i.description).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="p-2">
                  <p className="font-medium text-xs">{item.description}</p>
                  {item.sub_description && <p className="text-[10px] text-gray-500">{item.sub_description}</p>}
                </td>
                <td className="text-center p-2">{item.quantity}</td>
                <td className="text-right p-2">{(item.rate || 0).toLocaleString('en-IN')}</td>
                <td className="text-right p-2 font-medium">{(item.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        {/* <div className="text-right space-y-1 border-t pt-3">
          <p className="text-xs">Sub Total <span className="ml-4 font-semibold">₹{subtotal.toLocaleString('en-IN')}</span></p>
          <p className="text-xs">GST ({form.gst_percent || 18}%) <span className="ml-4 font-semibold">₹{gstAmount.toLocaleString('en-IN')}</span></p>
          <p className="text-sm font-bold text-orange-500 mt-2">Total Amount <span className="ml-4">₹{total.toLocaleString('en-IN')}</span></p>
        </div> */}

        {/* Totals */}
        <div className="text-right space-y-1 border-t pt-3">
          <p className="text-xs">
            Sub Total
            <span className="ml-4 font-semibold">
              ₹{(subtotal || 0).toLocaleString('en-IN')}
            </span>
          </p>

          <p className="text-sm font-bold text-orange-500 mt-2">
            Total Amount
            <span className="ml-4">
              ₹{(total || 0).toLocaleString('en-IN')}
            </span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-[10px] text-gray-400">Thank you for your business!</p>
          <p className="text-[10px] text-gray-400">We look forward to working with you again.</p>
        </div>
      </Card>
    </div>
  );
}