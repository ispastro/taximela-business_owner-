"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { use, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  getBusinessById,
  getBusinessCategories,
  updateBusiness,
} from "@/features/registration/api/registration";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useSessionStore } from "@/store/session-store";
import { ProtectedRoute } from "@/lib/auth-provider";

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

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedRoute>
      <BusinessDetailContent params={params} />
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
      setIsEditing(false);
    },
  });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-shell px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="tx-skeleton h-14" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !business) {
    return (
      <div className="min-h-screen bg-shell px-4 py-10">
        <div className="mx-auto max-w-3xl tx-alert tx-alert-error text-center">
          Failed to load business details.{" "}
          <Link href="/dashboard" className="font-semibold underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-shell px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-3xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link
              href="/dashboard"
              className="tx-sub-label hover:text-accent transition-colors"
              style={{ fontSize: "12px" }}
            >
              ← Dashboard
            </Link>
            <h1 className="tx-page-title mt-1">{business.name}</h1>
            <p className="tx-sub-label mt-0.5">{business.category_name ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => setIsEditing((v) => !v)}
              className="tx-btn-ghost"
              style={{ height: "32px", fontSize: "12px" }}
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        {/* ── View mode ── */}
        {!isEditing && (
          <div className="space-y-3">
            <div className="tx-panel p-4">
              <p className="tx-label mb-2">Location</p>
              <p className="tx-table-num">
                {business.latitude}, {business.longitude}
              </p>
            </div>

            <div className="tx-panel p-4">
              <p className="tx-label mb-3">Documents</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={business.government_id_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="tx-sub-label hover:text-accent transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  View National ID →
                </a>
                <a
                  href={business.license_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="tx-sub-label hover:text-accent transition-colors"
                  style={{ fontSize: "12px" }}
                >
                  View Business License →
                </a>
              </div>
            </div>

            {business.approved_at && (
              <div className="tx-panel p-4">
                <p className="tx-label mb-2">Approved At</p>
                <p className="tx-table-num">
                  {new Date(business.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Edit mode ── */}
        {isEditing && (
          <form
            onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="tx-panel p-5 space-y-4">
              <div>
                <label className="tx-label block mb-1.5" htmlFor="business_name">
                  Business Name
                </label>
                <input
                  id="business_name"
                  className={`tx-input${errors.business_name ? " error" : ""}`}
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
                <select
                  id="category_id"
                  className={`tx-select${errors.category_id ? " error" : ""}`}
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
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  style={{ color: "var(--text2)" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="logo preview"
                    className="mt-2 h-14 w-auto rounded object-contain"
                  />
                )}
              </div>
            </div>

            <div className="tx-panel p-5">
              <p className="tx-label block mb-3">Location</p>
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

            <div className="flex gap-3">
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
                onClick={() => setIsEditing(false)}
                className="tx-btn-ghost"
                style={{ height: "40px" }}
              >
                Cancel
              </button>
            </div>

            {updateMutation.isError && (
              <div className="tx-alert tx-alert-error">
                {(updateMutation.error as Error).message || "Update failed. Please try again."}
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
