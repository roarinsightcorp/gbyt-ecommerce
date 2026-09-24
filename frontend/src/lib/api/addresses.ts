import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

import type {
  Address,
  AddressPayload,
  AddressType,
} from "@/types/address";

const ADDRESS_ENDPOINT = "/account/addresses/";

type RawAddress = {
  id: number;

  address_type: AddressType;

  first_name: string;
  last_name: string;

  phone_number: string | null;

  address_line_1: string;
  address_line_2: string | null;

  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  company?: string;

  is_default: boolean;

  created_at: string;
  updated_at: string;
};

function normalizeAddress(address: RawAddress): Address {
  return {
    ...address,

    // Compatibility for older frontend components.
    phone: address.phone_number,

    is_default_shipping:
      address.address_type === "SHIPPING"
        ? address.is_default
        : false,

    is_default_billing:
      address.address_type === "BILLING"
        ? address.is_default
        : false,
  };
}

function normalizeAddressList(data: unknown): Address[] {
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === "object") {
    const response = data as {
      results?: unknown;
      addresses?: unknown;
      data?: unknown;
    };

    if (Array.isArray(response.results)) {
      items = response.results;
    } else if (Array.isArray(response.addresses)) {
      items = response.addresses;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    }
  }

  return items
    .filter((item): item is RawAddress => {
      if (!item || typeof item !== "object") {
        return false;
      }

      return (
        "id" in item &&
        "address_type" in item &&
        "first_name" in item &&
        "last_name" in item &&
        "phone_number" in item &&
        "address_line_1" in item &&
        "city" in item &&
        "state" in item &&
        "country" in item &&
        "is_default" in item &&
        "created_at" in item &&
        "updated_at" in item
      );
    })
    .map(normalizeAddress);
}

/**
 * Convert whatever the frontend form gives us into
 * the exact Django AddressSerializer contract.
 */
function toApiPayload(payload: AddressPayload): Record<string, unknown> {
  const addressType: AddressType =
    payload.address_type ??
    (payload.is_default_billing ? "BILLING" : "SHIPPING");

  const phoneNumber =
    payload.phone_number?.trim() ||
    payload.phone?.trim() ||
    "";

  let isDefault = payload.is_default;

  if (isDefault === undefined) {
    isDefault =
      addressType === "SHIPPING"
        ? Boolean(payload.is_default_shipping)
        : Boolean(payload.is_default_billing);
  }

  const apiPayload: Record<string, unknown> = {
    address_type: addressType,

    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),

    phone_number: phoneNumber,

    address_line_1: payload.address_line_1.trim(),

    city: payload.city.trim(),
    state: payload.state.trim(),
    country: payload.country.trim(),

    is_default: Boolean(isDefault),
  };

  const addressLine2 = payload.address_line_2?.trim();
  const postalCode = payload.postal_code?.trim();

  if (addressLine2) {
    apiPayload.address_line_2 = addressLine2;
  }

  if (postalCode) {
    apiPayload.postal_code = postalCode;
  }

  /*
   * IMPORTANT:
   * Do NOT send `company`.
   *
   * Your Django AddressSerializer does not expose company.
   */

  return apiPayload;
}

export async function getAddresses(): Promise<Address[]> {
  const response = await apiGet<unknown>(
    ADDRESS_ENDPOINT,
    true
  );

  return normalizeAddressList(response);
}

export async function createAddress(
  payload: AddressPayload
): Promise<Address> {
  const apiPayload = toApiPayload(payload);

  console.log(
    "[addresses] Creating address:",
    apiPayload
  );

  const response = await apiPost<RawAddress>(
    ADDRESS_ENDPOINT,
    apiPayload,
    true
  );

  return normalizeAddress(response);
}

export async function updateAddress(
  id: number,
  payload: AddressPayload
): Promise<Address> {
  const apiPayload = toApiPayload(payload);

  const response = await apiPatch<RawAddress>(
    `${ADDRESS_ENDPOINT}${id}/`,
    apiPayload,
    true
  );

  return normalizeAddress(response);
}

export async function deleteAddress(
  id: number
): Promise<void> {
  await apiDelete(
    `${ADDRESS_ENDPOINT}${id}/`,
    true
  );
}