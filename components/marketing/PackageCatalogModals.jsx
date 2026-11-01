"use client";

import { Loader2 } from "lucide-react";
import {
    DataMasterModal,
    DeleteConfirmModal,
    FormField,
    inputClassName,
} from "@/components/data-master/DataMasterUI";
import { formatCurrency } from "@/lib/finance/financeUtils";
import { cn } from "@/lib/utils";

function ModalFooter({ formId, onClose, isSaving, submitLabel }) {
    return (
        <>
            <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
                Batal
            </button>
            <button
                type="submit"
                form={formId}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066CC] px-4 text-sm font-bold text-white shadow-sm shadow-blue-600/25 transition hover:bg-[#0052A3] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSaving ? (
                    <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                    />
                ) : null}
                {isSaving ? "Menyimpan..." : submitLabel}
            </button>
        </>
    );
}

function TextArea({
    id,
    value,
    onChange,
    disabled,
    hasError,
    placeholder,
    rows = 3,
}) {
    return (
        <textarea
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            rows={rows}
            placeholder={placeholder}
            className={cn(
                inputClassName(hasError),
                "h-auto min-h-24 resize-y py-3 leading-relaxed",
            )}
        />
    );
}

function VenueOptions({ venues }) {
    return venues.map((venue) => (
        <option key={venue.id} value={venue.id}>
            {venue.name} - {venue.location}
            {venue.status === "MAINTENANCE" ? " (Maintenance)" : ""}
        </option>
    ));
}

export function PackageFormModal({ catalog }) {
    const form = catalog.formData;
    const errors = catalog.formErrors;
    const isSaving = catalog.isSaving;

    return (
        <DataMasterModal
            open={catalog.isFormOpen}
            title={catalog.editingPackage ? "Ubah Paket" : "Tambah Paket"}
            description="Katalog ini dikelola oleh Marketing, lalu digunakan Finance pada form pembayaran dan langganan. Perubahan katalog tidak mengubah snapshot histori lama."
            onClose={catalog.closeForm}
            disableClose={isSaving}
            maxWidthClassName="max-w-3xl"
            footer={
                <ModalFooter
                    formId="marketing-package-form"
                    onClose={catalog.closeForm}
                    isSaving={isSaving}
                    submitLabel={
                        catalog.editingPackage
                            ? "Simpan Perubahan"
                            : "Tambah Paket"
                    }
                />
            }
        >
            <form
                id="marketing-package-form"
                onSubmit={catalog.submitForm}
                className="grid gap-5 sm:grid-cols-2"
                noValidate
            >
                <FormField
                    label="Nama Paket"
                    htmlFor="package-name"
                    error={errors.name}
                    required
                >
                    <input
                        id="package-name"
                        value={form.name}
                        onChange={(event) =>
                            catalog.updateField("name", event.target.value)
                        }
                        placeholder="AAA Sport Academy 1 Bulan"
                        disabled={isSaving}
                        className={inputClassName(Boolean(errors.name))}
                    />
                </FormField>

                <FormField
                    label="Program"
                    htmlFor="package-program"
                    error={errors.program}
                    required
                >
                    <select
                        id="package-program"
                        value={form.program}
                        onChange={(event) =>
                            catalog.updateField("program", event.target.value)
                        }
                        disabled={isSaving}
                        className={inputClassName(Boolean(errors.program))}
                    >
                        {catalog.programOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField
                    label="Harga (Rupiah)"
                    htmlFor="package-price"
                    error={errors.price}
                    required
                >
                    <input
                        id="package-price"
                        type="number"
                        min="1"
                        step="1"
                        value={form.price}
                        onChange={(event) =>
                            catalog.updateField("price", event.target.value)
                        }
                        placeholder="650000"
                        disabled={isSaving}
                        className={inputClassName(Boolean(errors.price))}
                    />
                    {form.price ? (
                        <p className="mt-1.5 text-xs font-semibold text-slate-500">
                            {formatCurrency(Number(form.price) || 0)}
                        </p>
                    ) : null}
                </FormField>

                <FormField
                    label="Tempat Latihan Default"
                    htmlFor="package-venue"
                    error={errors.defaultTrainingVenueId}
                >
                    <select
                        id="package-venue"
                        value={form.defaultTrainingVenueId}
                        onChange={(event) =>
                            catalog.updateField(
                                "defaultTrainingVenueId",
                                event.target.value,
                            )
                        }
                        disabled={isSaving}
                        className={inputClassName(
                            Boolean(errors.defaultTrainingVenueId),
                        )}
                    >
                        <option value="">Pilih saat pembayaran</option>
                        <VenueOptions venues={catalog.venues} />
                    </select>
                </FormField>

                <FormField
                    label="Label Durasi"
                    htmlFor="package-duration-label"
                    error={errors.durationLabel}
                    required
                >
                    <input
                        id="package-duration-label"
                        value={form.durationLabel}
                        onChange={(event) =>
                            catalog.updateField(
                                "durationLabel",
                                event.target.value,
                            )
                        }
                        placeholder="1 Bulan"
                        disabled={isSaving}
                        className={inputClassName(
                            Boolean(errors.durationLabel),
                        )}
                    />
                </FormField>

                <FormField
                    label="Durasi (hari)"
                    htmlFor="package-duration-days"
                    error={errors.durationDays}
                    required
                >
                    <input
                        id="package-duration-days"
                        type="number"
                        min="1"
                        step="1"
                        value={form.durationDays}
                        onChange={(event) =>
                            catalog.updateField(
                                "durationDays",
                                event.target.value,
                            )
                        }
                        placeholder="30"
                        disabled={isSaving}
                        className={inputClassName(Boolean(errors.durationDays))}
                    />
                </FormField>

                <FormField
                    label="Total Sesi"
                    htmlFor="package-sessions"
                    error={errors.totalSessions}
                >
                    <input
                        id="package-sessions"
                        type="number"
                        min="1"
                        step="1"
                        value={form.totalSessions}
                        onChange={(event) =>
                            catalog.updateField(
                                "totalSessions",
                                event.target.value,
                            )
                        }
                        placeholder="Kosongkan jika berbasis waktu"
                        disabled={isSaving}
                        className={inputClassName(
                            Boolean(errors.totalSessions),
                        )}
                    />
                </FormField>

                <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(event) =>
                                catalog.updateField(
                                    "isActive",
                                    event.target.checked,
                                )
                            }
                            disabled={isSaving}
                            className="h-4 w-4 rounded border-slate-300 accent-[#0066CC]"
                        />
                        Paket aktif dan dapat dijual
                    </label>
                </div>

                <div className="sm:col-span-2">
                    <FormField
                        label="Deskripsi Paket"
                        htmlFor="package-description"
                        error={errors.description}
                    >
                        <TextArea
                            id="package-description"
                            value={form.description}
                            onChange={(event) =>
                                catalog.updateField(
                                    "description",
                                    event.target.value,
                                )
                            }
                            disabled={isSaving}
                            hasError={Boolean(errors.description)}
                            placeholder="Jelaskan manfaat, frekuensi latihan, atau ketentuan paket..."
                        />
                    </FormField>
                </div>
            </form>
        </DataMasterModal>
    );
}

export function PackageDeleteModal({ catalog }) {
    const target = catalog.deleteTarget;

    return (
        <DeleteConfirmModal
            open={Boolean(target)}
            title="Hapus Paket"
            itemName={target?.name ?? ""}
            description="Paket yang sudah memiliki histori langganan/transaksi tidak dapat dihapus dan sebaiknya dinonaktifkan."
            isDeleting={catalog.isDeleting}
            onCancel={catalog.cancelDelete}
            onConfirm={catalog.confirmDelete}
        />
    );
}
