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
  category_id: z.string().min(1, "Category is required"),
  locationLat: z.number({ error: "Map pin is required" }),
  locationLng: z.number({ error: "Map pin is required" }),
  business_logo: z.instanceof(File).optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

const fieldClassName =
  "mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 sm:text-sm";

const labelClassName = "text-xs font-semibold tracking-[0.14em] text-slate-500";

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <ProtectedRoute>
      <BusinessDetailContent params={params} />
    </ProtectedRoute>
  );
}

function BusinessDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const accessToken = useSessionStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business", id],
    queryFn: () => getBusinessById(accessToken ?? "", id),
    enabled: !!accessToken,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const business = data?.data;

  const { register, control, handleSubmit, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    values: business
      ? {
          business_name: business.name,
          category_id: business.category_id ?? "",
          locationLat: business.latitude,
          locationLng: business.longitude,
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
        category_id: values.category_id,
        latitude: values.locationLat,
        longitude: values.locationLng,
        ...(logoUrl ? { business_logo: logoUrl } : {}),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["business", id] });
      void queryClient.invalidateQueries({ queryKey: ["my-businesses"] });
      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          Failed to load business details.
          <Link href="/dashboard" className="ml-2 font-medium underline">Go back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <main className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600">← Dashboard</Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{business.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{business.category_name ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
              business.status === "active"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}>
              {business.status === "active" ? "Active" : "Suspended"}
            </span>
            <button
              onClick={() => setIsEditing((v) => !v)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        {/* View Mode */}
        {!isEditing && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className={labelClassName}>LOCATION</p>
              <p className="mt-1 text-sm text-slate-700">
                {business.latitude}, {business.longitude}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className={labelClassName}>DOCUMENTS</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <a
                  href={business.government_id_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
                >
                  View National ID →
                </a>
                <a
                  href={business.license_photo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline"
                >
                  View Business License →
                </a>
              </div>
            </div>

            {business.approved_at && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className={labelClassName}>APPROVED AT</p>
                <p className="mt-1 text-sm text-slate-700">
                  {new Date(business.approved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="mt-6 space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <label className={labelClassName} htmlFor="business_name">BUSINESS NAME</label>
              <input id="business_name" className={fieldClassName} {...register("business_name")} />
              {errors.business_name && <p className="mt-1 text-sm text-rose-600">{errors.business_name.message}</p>}

              <label className={`${labelClassName} mt-5 block`} htmlFor="category_id">CATEGORY</label>
              <select id="category_id" className={fieldClassName} {...register("category_id")}>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="mt-1 text-sm text-rose-600">{errors.category_id.message}</p>}

              <label className={`${labelClassName} mt-5 block`}>BUSINESS LOGO (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 text-sm text-slate-600"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
              />
              {logoPreview && (
                <img src={logoPreview} alt="logo preview" className="mt-2 h-16 w-auto rounded object-contain" />
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className={`${labelClassName} mb-3 block`}>LOCATION</p>
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
                <p className="mt-2 text-sm text-rose-600">Map pin is required</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 hover:border-slate-400"
              >
                Cancel
              </button>
            </div>

            {updateMutation.isError && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {(updateMutation.error as Error).message || "Update failed. Please try again."}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
