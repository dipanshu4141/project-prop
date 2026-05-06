'use client';

// apps/dashboard/src/app/v2/properties/new/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────

type ListingType      = 'RENT' | 'SALE';
type PropertyCategory = 'RESIDENTIAL' | 'COMMERCIAL' | 'PLOT';
type FurnishingType   = 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';

const BHK_OPTIONS    = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'];
const FURNISH_LABELS: Record<FurnishingType, string> = {
  FURNISHED:       'Furnished',
  SEMI_FURNISHED:  'Semi-furnished',
  UNFURNISHED:     'Unfurnished',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-stone-500 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-[#0B1F14]
        focus:outline-none focus:border-emerald-400 transition-colors
        placeholder:text-stone-300 ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  const { placeholder, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-[#0B1F14]
        focus:outline-none focus:border-emerald-400 transition-colors bg-white ${rest.className ?? ''}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

function ToggleGroup<T extends string>({
  options, value, onChange, labels,
}: {
  options: T[];
  value: T | '';
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            value === o
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300'
          }`}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-[#0B1F14] uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter();

  // Core
  const [listingType, setListingType]           = useState<ListingType | ''>('');
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory | ''>('');
  const [bhk, setBhk]                           = useState('');

  // Location
  const [city, setCity]         = useState('');
  const [area, setArea]         = useState('');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState('');

  // Financials
  const [price, setPrice]     = useState('');
  const [deposit, setDeposit] = useState('');

  // Details
  const [areaSqft, setAreaSqft]     = useState('');
  const [furnishing, setFurnishing] = useState<FurnishingType | ''>('');
  const [floor, setFloor]           = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [negotiable, setNegotiable] = useState(false);

  // Contact
  const [contactRaw, setContactRaw] = useState(''); // comma-separated phones

  // Notes
  const [notes, setNotes] = useState('');

  // Submission
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const isResidential = propertyCategory === 'RESIDENTIAL';
  const isRent        = listingType === 'RENT';

  const handleSubmit = async () => {
    setError('');

    if (!listingType) { setError('Please select Rent or Sale.'); return; }

    setSaving(true);
    try {
      const contacts = contactRaw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        listingType,
        propertyCategory:  propertyCategory  || undefined,
        bhk:               bhk               || undefined,
        city:              city.trim()        || undefined,
        area:              area.trim()        || undefined,
        building:          building.trim()    || undefined,
        location:          location.trim()    || undefined,
        price:             price              ? Number(price)      : undefined,
        deposit:           deposit            ? Number(deposit)    : undefined,
        areaSqft:          areaSqft           ? Number(areaSqft)   : undefined,
        furnishing:        furnishing         || undefined,
        floor:             floor              ? Number(floor)      : undefined,
        totalFloors:       totalFloors        ? Number(totalFloors): undefined,
        negotiable:        negotiable         || undefined,
        notes:             notes.trim()       || undefined,
        contacts:          contacts.length    ? contacts : undefined,
        availability:      'AVAILABLE',
      };

      const listing = await apiPost<{ id: string }>('/properties', payload);
      router.push(`/v2/properties/${listing.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/v2/properties')}
            className="text-stone-400 hover:text-stone-600 transition-colors text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-[#0B1F14]">Add Property</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Type */}
        <Section title="Listing Type">
          <div>
            <Label required>Rent or Sale</Label>
            <ToggleGroup
              options={['RENT', 'SALE'] as ListingType[]}
              value={listingType}
              onChange={setListingType}
              labels={{ RENT: 'For Rent', SALE: 'For Sale' }}
            />
          </div>
          <div>
            <Label>Property Category</Label>
            <ToggleGroup
              options={['RESIDENTIAL', 'COMMERCIAL', 'PLOT'] as PropertyCategory[]}
              value={propertyCategory}
              onChange={setPropertyCategory}
              labels={{ RESIDENTIAL: 'Residential', COMMERCIAL: 'Commercial', PLOT: 'Plot / Land' }}
            />
          </div>
          {isResidential && (
            <div>
              <Label>BHK</Label>
              <ToggleGroup
                options={BHK_OPTIONS}
                value={bhk}
                onChange={setBhk}
              />
            </div>
          )}
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            <div>
              <Label>Area / Locality</Label>
              <Input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Andheri West"
              />
            </div>
          </div>
          <div>
            <Label>Building / Society Name</Label>
            <Input
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="Oberoi Springs"
            />
          </div>
          <div>
            <Label>Full Address / Landmark</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Near DN Nagar Metro"
            />
          </div>
        </Section>

        {/* Financials */}
        <Section title="Price">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{isRent ? 'Monthly Rent (₹)' : 'Asking Price (₹)'}</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={isRent ? '45000' : '8500000'}
                min={0}
              />
            </div>
            {isRent && (
              <div>
                <Label>Security Deposit (₹)</Label>
                <Input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="90000"
                  min={0}
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={negotiable}
              onChange={(e) => setNegotiable(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <span className="text-sm text-stone-600">Price is negotiable</span>
          </label>
        </Section>

        {/* Property Details */}
        <Section title="Property Details">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Area (sq ft)</Label>
              <Input
                type="number"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                placeholder="950"
                min={0}
              />
            </div>
            <div>
              <Label>Furnishing</Label>
              <Select
                value={furnishing}
                onChange={(e) => setFurnishing(e.target.value as FurnishingType)}
                placeholder="Select…"
              >
                {(Object.keys(FURNISH_LABELS) as FurnishingType[]).map((f) => (
                  <option key={f} value={f}>{FURNISH_LABELS[f]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Floor</Label>
              <Input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="4"
              />
            </div>
            <div>
              <Label>Total Floors</Label>
              <Input
                type="number"
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <div>
            <Label>Phone Numbers</Label>
            <Input
              value={contactRaw}
              onChange={(e) => setContactRaw(e.target.value)}
              placeholder="9820001234, 9821005678"
            />
            <p className="text-xs text-stone-400 mt-1">Separate multiple numbers with commas</p>
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional details — facing direction, parking, amenities…"
            className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-emerald-400 transition-colors resize-none
              placeholder:text-stone-300"
          />
        </Section>

        {/* Submit */}
        <div className="flex gap-3 pb-10">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-emerald-600 text-white font-semibold text-sm
              py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Add Listing'}
          </button>
          <button
            onClick={() => router.push('/v2/properties')}
            className="text-sm text-stone-500 border border-stone-200 px-5 py-3
              rounded-xl hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}