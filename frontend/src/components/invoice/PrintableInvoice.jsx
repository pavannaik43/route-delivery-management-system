import React from 'react';

// Number to words converter for INR
function inrToWords(amount) {
  const num = Math.floor(amount);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  function convertBelowThousand(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? ones[n % 10] + ' ' : '');
    return ones[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? convertBelowThousand(n % 100) : '');
  }

  let words = '';
  if (Math.floor(num / 10000000) > 0) {
    words += convertBelowThousand(Math.floor(num / 10000000)) + 'Crore ';
  }
  if (Math.floor((num % 10000000) / 100000) > 0) {
    words += convertBelowThousand(Math.floor((num % 10000000) / 100000)) + 'Lakh ';
  }
  if (Math.floor((num % 100000) / 1000) > 0) {
    words += convertBelowThousand(Math.floor((num % 100000) / 1000)) + 'Thousand ';
  }
  if (num % 1000 > 0) {
    words += convertBelowThousand(num % 1000);
  }

  return 'Rupees ' + words.trim() + ' Only';
}

export const PrintableInvoice = ({ invoice, id = 'printable-invoice' }) => {
  if (!invoice) return null;

  const {
    invoice_no,
    invoiceNo,
    delivery_date,
    deliveryDate,
    total_amount,
    totalAmount,
    shop_name,
    shopName,
    owner_name,
    ownerName,
    shop_phone,
    shopPhone,
    shop_address,
    shopAddress,
    shop_route,
    shopRoute,
    delivered_by_username,
    deliveredBy,
    items = [],
    shop = {},
    companyInfo = {
      name: 'Hatsun Agro Product Ltd.',
      subtitle: 'Route Delivery Management System (RDMS)',
      address: 'Plot No. 14, TNHB Complex, Chennai - 600040, Tamil Nadu',
      gstin: '33AAACH1234F1Z5',
      fssai: '10012042000123',
      phone: '1800-425-4287',
      email: 'support@hap.dairy.in'
    }
  } = invoice;

  const invNumber = invoice_no || invoiceNo || 'INV-DRAFT';
  const invDate = delivery_date || deliveryDate || new Date().toISOString().split('T')[0];
  const grandTotal = Number(total_amount !== undefined ? total_amount : totalAmount) || 0;
  const storeName = shop_name || shopName || shop?.shop_name || 'Retail Partner';
  const owner = owner_name || ownerName || shop?.owner_name || '';
  const phone = shop_phone || shopPhone || shop?.phone || '';
  const address = shop_address || shopAddress || shop?.address || '';
  const route = shop_route || shopRoute || shop?.route || '';
  const staff = delivered_by_username || deliveredBy || 'Staff';

  return (
    <div id={id} className="p-6 bg-white text-slate-800 text-xs font-sans max-w-3xl mx-auto border border-slate-200 rounded-lg">
      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-base">
              H
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-primary tracking-wide leading-none">{companyInfo.name}</h2>
              <p className="text-[10px] text-slate-500 font-medium">{companyInfo.subtitle}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 leading-relaxed max-w-sm">{companyInfo.address}</p>
          <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
            <span><strong>GSTIN:</strong> {companyInfo.gstin}</span>
            <span><strong>FSSAI:</strong> {companyInfo.fssai}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-primary font-bold text-xs uppercase tracking-wider mb-1.5 border border-primary/20">
            TAX INVOICE / DELIVERY CHALLAN
          </span>
          <p className="text-sm font-bold text-slate-900">{invNumber}</p>
          <p className="text-[11px] text-slate-600">Date: {invDate}</p>
          <p className="text-[10px] text-slate-500">Route: {route}</p>
        </div>
      </div>

      {/* Bill To Info */}
      <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERED TO (RETAILER)</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{storeName}</p>
          {owner && <p className="text-xs text-slate-700">Prop: {owner}</p>}
          {address && <p className="text-[11px] text-slate-600 mt-0.5">{address}</p>}
          {phone && <p className="text-[11px] text-slate-600">Phone: {phone}</p>}
        </div>

        <div className="text-right flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERY DETAILS</p>
            <p className="text-xs font-semibold text-slate-800 mt-0.5">Route: {route || 'Main Distribution'}</p>
            <p className="text-xs text-slate-600">Delivered By: {staff}</p>
          </div>
          <div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              STOCK DISPATCHED & VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto my-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-100/80 text-[10px] font-bold text-slate-700 uppercase">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3">Product Description</th>
              <th className="py-2 px-2 text-center">Category</th>
              <th className="py-2 px-2 text-center">Size</th>
              <th className="py-2 px-3 text-right">Qty</th>
              <th className="py-2 px-3 text-right">Rate (₹)</th>
              <th className="py-2 px-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                <td className="py-2 px-3 font-semibold text-slate-800">
                  {item.product_name || item.productName || item.name}
                </td>
                <td className="py-2 px-2 text-center text-slate-500 text-[11px]">{item.category || '-'}</td>
                <td className="py-2 px-2 text-center text-slate-500 text-[11px]">{item.size || '-'}</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">{item.quantity}</td>
                <td className="py-2 px-3 text-right text-slate-700">
                  ₹{Number(item.unit_price !== undefined ? item.unit_price : item.unitPrice).toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">
                  ₹{Number(item.subtotal).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
              <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">
                Total Units Delivered:
              </td>
              <td className="py-2.5 px-3 text-right text-primary font-extrabold text-sm">
                {items.reduce((sum, i) => sum + Number(i.quantity), 0)}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-700">Grand Total:</td>
              <td className="py-2.5 px-3 text-right text-primary font-extrabold text-base">
                ₹{grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount in words */}
      <div className="p-2.5 bg-blue-50/60 rounded border border-blue-100 text-[11px] font-medium text-slate-700 mb-6">
        <span className="font-bold text-primary">Amount in words:</span> {inrToWords(grandTotal)}
      </div>

      {/* Signatures and Footer */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 mt-6 text-center">
        <div>
          <div className="border-b border-dashed border-slate-300 h-10 w-48 mx-auto"></div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">Customer / Receiver Signature & Stamp</p>
        </div>
        <div>
          <div className="border-b border-dashed border-slate-300 h-10 w-48 mx-auto"></div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase">Authorized Delivery Executive Signature</p>
        </div>
      </div>

      <p className="text-[9px] text-slate-400 text-center mt-6">
        This is a computer generated invoice by Hatsun Route Delivery Management System. Thank you for partnering with Hatsun Agro Products!
      </p>
    </div>
  );
};
