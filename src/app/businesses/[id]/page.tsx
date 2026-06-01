"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { use, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { OwnerAppShell } from "@/features/owner/components/owner-app-shell";
import { OwnerLoadingScreen } from "@/features/owner/components/owner-loading-screen";
import { OwnerPageHeader } from "@/features/owner/components/owner-page-header";
import { OwnerSection } from "@/features/owner/components/owner-section";
import { RequiresApprovedBusiness } from "@/features/owner/components/requires-approved-business";
import {
  getBusinessById,
  getBusinessCategories,
  updateBusiness,
  type Business,
} from "@/features/registration/api/registration";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ProtectedRoute } from "@/lib/auth-provider";
import { useSessionStore } from "@/store/session-store";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/registration/components/location-picker-map").then(
      (m) => m.LocationPickerMap,
    ),
  { ssr: false },
);

const editSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required"),
  category_id:   z.string().min(1, "Category is required"),
  locationLat:   z.number({ error: "Map pin is required" }),
  locationLng:   z.number({ error: "Map pin is required" }),
  business_logo: z.instanceof(File).optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function FieldCurrent({ value }: { value: string }) {
  return (
    <p className="tx-field-current">
      <strong>Current:</strong> {value}
    </p>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="tx-readonly-item">
      <p className="tx-label">{label}</p>
      <p className="tx-readonly-value">{value}</p>
    </div>
  );
}

function VerifiedDetailsSection({ business }: { business: Business }) {
  return (
    <OwnerSection
      title="Verified Registration Details"
      description="Locked after admin approval. Submit a new application if these need to change."
    >
      <div className="tx-readonly-grid">
        <ReadOnlyField label="National ID Number" value={business.government_id_fan || "—"} />
        <div className="tx-readonly-item">
          <p className="tx-label">National ID Document</p>
          <a href={business.government_id_photo_url} target="_blank" rel="noreferrer" className="tx-link">
            View uploaded document →
          </a>
        </div>
        <div className="tx-readonly-item">
          <p className="tx-label">Business License Document</p>
          <a href={business.license_photo_url} target="_blank" rel="noreferrer" className="tx-link">
            View uploaded document →
          </a>
        </div>
        <ReadOnlyField label="Approved On" value={formatDate(business.approved_at)} />
        {business.approver_name && (
          <ReadOnlyField label="Approved By" value={business.approver_name} />
        )}
      </div>
    </OwnerSection>
  );
}

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedRoute>
      <RequiresApprovedBusiness>
        <BusinessDetailContent params={params} />
      </RequiresApprovedBusiness>
    </ProtectedRoute>
  );
}

function BusinessDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }         = use(params);
  const accessToken    = useSessionStore((s) => s.accessToken);
  const queryClient    = useQueryClient();
  const [isEditing,    setIsEditing]    = useState(false);
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business", id],
    queryFn:  () => getBusinessById(accessToken ?? "", id),
    enabled:  !!accessToken,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["business-categories"],
    queryFn:  getBusinessCategories,
  });

  const business = data?.data;

  const { register, control, handleSubmit, formState: { errors } } =
    useForm<EditFormValues>({
      resolver: zodResolver(editSchema),
      values: business
        ? {
            business_name: business.name,
            category_id:   business.category_id ?? "",
            locationLat:   business.latitude,
            locationLng:   business.longitude,
            business_logo: undefined,
          }
        : undefined,
    });

  const updateMutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      let logoUrl: string | undefined;
      if (values.business_logo) {
        logoUrl = await uploadToCloudinary(values.business_logo);
      }
      return updateBusiness(accessToken ?? "", id, {
        business_name: values.business_name,
        category_id:   values.category_id,
        latitude:      values.locationLat,
        longitude:     values.locationLng,
        ...(logoUrl ? { business_logo: logoUrl } : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business", id] });
      void queryClient.invalidateQueries({ queryKey: ["my-businesses"] });
      setLogoPreview(null);
      setIsEditing(false);
    },
  });

  function handleCancelEdit() {
    setLogoPreview(null);
    setIsEditing(false);
  }

  if (isLoading) {
    return <OwnerLoadingScreen />;
  }

  if (isError || !business) {
    return (
      <OwnerAppShell width="medium">
        <div className="tx-alert tx-alert-error text-center">
          Failed to load business details.{" "}
          <Link href="/dashboard" className="font-semibold underline">
            Go back to dashboard
          </Link>
        </div>
      </OwnerAppShell>
    );
  }

  return (
    <OwnerAppShell width="medium">
      <OwnerPageHeader
        eyebrow="Manage Business"
        title={business.name}
        description={business.category_name ?? "Uncategorized"}
        backHref="/dashboard"
        backLabel="Dashboard"
        actions={
          <>
            <span
              className={
                business.status === "active"
                  ? "tx-badge tx-badge-green"
                  : "tx-badge tx-badge-red"
              }
            >
              {business.status === "active" ? "Active" : "Suspended"}
            </span>
            <button
              type="button"
              onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
              className="tx-btn-ghost"
            >
              {isEditing ? "Cancel edit" : "Edit business"}
            </button>
          </>
        }
      />

      {!isEditing && (
        <div className="space-y-3">
          <div className="tx-panel p-4">
            <p className="tx-label mb-2">Business Name</p>
            <p className="tx-row-name">{business.name}</p>
          </div>

          <div className="tx-panel p-4">
            <p className="tx-label mb-2">Category</p>
            <p className="tx-row-name">{business.category_name ?? "Uncategorized"}</p>
          </div>

          {business.business_logo && (
            <div className="tx-panel p-4">
              <p className="tx-label mb-2">Business Logo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.business_logo}
                alt={`${business.name} logo`}
                className="h-16 w-auto object-contain"
              />
            </div>
          )}

          <div className="tx-panel p-4">
            <p className="tx-label mb-2">Location</p>
            <p className="tx-table-num">
              {formatCoordinates(business.latitude, business.longitude)}
            </p>
          </div>

          <VerifiedDetailsSection business={business} />
        </div>
      )}

      {isEditing && (
        <form
          onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
          className="space-y-4"
        >
          <OwnerSection
            title="Editable Details"
            description="Changes save immediately — no re-approval required."
          >
            <div className="tx-panel p-5 space-y-4">
              <div>
                <label className="tx-label block mb-1.5" htmlFor="business_name">
                  Business Name
                </label>
                <FieldCurrent value={business.name} />
                <input
                  id="business_name"
                  className={`tx-input mt-2${errors.business_name ? " error" : ""}`}
                  {...register("business_name")}
                />
                {errors.business_name && (
                  <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tx-label block mb-1.5" htmlFor="category_id">
                  Category
                </label>
                <FieldCurrent value={business.category_name ?? "Uncategorized"} />
                <select
                  id="category_id"
                  className={`tx-select mt-2${errors.category_id ? " error" : ""}`}
                  {...register("category_id")}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="tx-label block mb-1.5">
                  Business Logo (optional)
                </label>
                <FieldCurrent
                  value={business.business_logo ? "Logo uploaded" : "No logo uploaded yet"}
                />
                {business.business_logo && !logoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.business_logo}
                    alt="Current logo"
                    className="mt-2 h-14 w-auto object-contain"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 text-xs"
                  style={{ color: "var(--text2)" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
                {logoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="New logo preview"
                    className="mt-2 h-14 w-auto object-contain"
                  />
                )}
                <p className="tx-field-current mt-2">
                  Upload a new file only if you want to replace the current logo.
                </p>
              </div>
            </div>
          </OwnerSection>

          <OwnerSection title="Location">
            <div className="tx-panel p-5">
              <FieldCurrent
                value={formatCoordinates(business.latitude, business.longitude)}
              />
              <p className="tx-field-current mt-1 mb-3">
                Click the map to set a new pin if your business moved.
              </p>
              <Controller
                control={control}
                name="locationLat"
                render={({ field: latField }) => (
                  <Controller
                    control={control}
                    name="locationLng"
                    render={({ field: lngField }) => (
                      <LocationPickerMap
                        latitude={Number.isFinite(latField.value) ? latField.value : null}
                        longitude={Number.isFinite(lngField.value) ? lngField.value : null}
                        onPick={(lat, lng) => {
                          latField.onChange(lat);
                          lngField.onChange(lng);
                        }}
                      />
                    )}
                  />
                )}
              />
              {(errors.locationLat || errors.locationLng) && (
                <p className="mt-2 text-xs" style={{ color: "var(--red)" }}>
                  Map pin is required
                </p>
              )}
            </div>
          </OwnerSection>

          <VerifiedDetailsSection business={business} />

          <div className="tx-panel flex flex-col items-start gap-4 p-5">
            <p className="tx-sub-label" style={{ fontSize: "12px" }}>
              Only operational details can be edited. Verified identity and license records stay locked.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="tx-btn-primary"
                style={{ height: "40px" }}
              >
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="tx-btn-ghost"
                style={{ height: "40px" }}
              >
                Cancel
              </button>
            </div>
          </div>

          {updateMutation.isError && (
            <div className="tx-alert tx-alert-error">
              {(updateMutation.error as Error).message || "Update failed. Please try again."}
            </div>
          )}
        </form>
      )}
    </OwnerAppShell>
  );
}
