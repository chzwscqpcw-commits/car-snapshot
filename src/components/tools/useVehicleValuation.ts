"use client";

import { useEffect, useMemo, useState } from "react";
import {
  lookupNewPrice,
  calculateDepreciationBaseline,
  combineValuationLayers,
  getConditionAdjustment,
  getColourAdjustment,
  getMileageAdjustment,
  latestRecordedMileage,
  type ConditionInputs,
  type ValuationResult as ValuationResultType,
} from "@/lib/valuation";
import { parseModel, expandBaseModelForLookup } from "@/lib/model-parser";
import newPricesData from "@/data/new-prices.json";

const NEW_PRICES = newPricesData as Array<{ make: string; model: string; newPrice: number }>;

/** Server response from /api/valuation (eBay + cache + MarketCheck signals). */
export interface ValuationServerData {
  ebayMedian: number | null;
  ebayQ1Price: number | null;
  ebayQ3Price: number | null;
  ebayListingCount: number;
  ebayMinPrice: number | null;
  ebayMaxPrice: number | null;
  ebayTotalListings: number | null;
  ebayDominantTransmission: string | null;
  ebayDominantBodyType: string | null;
  ebayYearWidened: boolean;
  cacheMedian: number | null;
  cacheEntryCount: number;
  marketcheckMedian: number | null;
  marketcheckQ1: number | null;
  marketcheckQ3: number | null;
  marketcheckListingCount: number;
  marketcheckSource: "cache" | "api" | null;
  sources: string[];
}

interface ValuationVehicle {
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  fuelType?: string;
  engineCapacity?: number;
  colour?: string;
  motTests?: Array<{
    completedDate?: string;
    testResult?: string;
    odometer?: { value: number; unit?: string };
    rfrAndComments?: Array<{ type: string }>;
  }>;
}

/**
 * SINGLE SOURCE OF TRUTH for the blended vehicle valuation.
 *
 * Encapsulates the whole pipeline — expanded/parsed-model new-price lookup,
 * depreciation baseline, km-safe latest mileage, the /api/valuation fetch
 * (eBay + cache + MarketCheck), and the combineValuationLayers blend — so the
 * standalone valuation tool, the standalone running-costs tool, and (in time)
 * the full report all produce the SAME number for the same car. This is what
 * stops the cross-surface drift the consistency audit found.
 *
 * Pass `condition` to layer in the user's condition refinements (the valuation
 * tool); omit it for the plain headline estimate (running-costs depreciation
 * anchoring just needs `estimatedValue`).
 */
export function useVehicleValuation(
  vehicle: ValuationVehicle,
  condition: ConditionInputs | null = null,
) {
  const [serverData, setServerData] = useState<ValuationServerData | null>(null);
  const [loading, setLoading] = useState(true);

  // New price keyed on the EXPANDED/parsed model (e.g. "320d" → "3 Series"),
  // matching the full report so the same car finds the same new price.
  const newPrice = useMemo(() => {
    if (!vehicle.make || !vehicle.model) return null;
    const parsed = parseModel(vehicle.model, vehicle.make);
    const lookupModel = expandBaseModelForLookup(vehicle.make, parsed);
    return lookupNewPrice(NEW_PRICES, vehicle.make, lookupModel || vehicle.model);
  }, [vehicle.make, vehicle.model]);

  const age = useMemo(
    () =>
      vehicle.yearOfManufacture
        ? Math.max(0, new Date().getFullYear() - vehicle.yearOfManufacture)
        : null,
    [vehicle.yearOfManufacture],
  );
  const mileage = useMemo(() => latestRecordedMileage(vehicle.motTests), [vehicle.motTests]);
  const advisoryCount = useMemo(
    () => vehicle.motTests?.[0]?.rfrAndComments?.filter((r) => r.type === "ADVISORY").length ?? 0,
    [vehicle.motTests],
  );
  const recentFailure = vehicle.motTests?.[0]?.testResult === "FAILED";

  const depEstimate = useMemo(() => {
    if (newPrice === null || age === null) return null;
    return calculateDepreciationBaseline(newPrice, age, vehicle.make!, vehicle.model!, mileage);
  }, [newPrice, age, vehicle.make, vehicle.model, mileage]);

  useEffect(() => {
    if (!vehicle.make || !vehicle.model || !vehicle.yearOfManufacture || depEstimate === null) {
      // Reset/early-exit state for the valuation fetch this effect performs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.yearOfManufacture),
      depreciationEstimate: String(depEstimate),
    });
    if (newPrice) params.set("newPrice", String(newPrice));
    if (vehicle.fuelType) params.set("fuelType", vehicle.fuelType);
    if (vehicle.engineCapacity) params.set("engineCapacity", String(vehicle.engineCapacity));
    if (mileage) params.set("mileage", String(mileage));
    if (vehicle.colour) params.set("colour", String(getColourAdjustment(vehicle.colour)));

    fetch(`/api/valuation?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ValuationServerData | null) => {
        if (!cancelled) {
          setServerData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerData(null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    vehicle.make,
    vehicle.model,
    vehicle.yearOfManufacture,
    vehicle.fuelType,
    vehicle.engineCapacity,
    vehicle.colour,
    mileage,
    newPrice,
    depEstimate,
  ]);

  const valuation = useMemo<ValuationResultType | null>(() => {
    if (depEstimate === null) return null;
    const { total: condAdj, motAuto } = getConditionAdjustment(condition, advisoryCount, recentFailure);
    const colourAdj = getColourAdjustment(vehicle.colour);
    const result = combineValuationLayers(
      depEstimate,
      serverData?.ebayMedian ?? null,
      serverData?.ebayListingCount ?? 0,
      serverData?.cacheMedian ?? null,
      serverData?.cacheEntryCount ?? 0,
      condAdj,
      colourAdj,
      serverData?.ebayTotalListings ?? null,
      serverData?.ebayMinPrice ?? null,
      serverData?.ebayMaxPrice ?? null,
      serverData?.ebayDominantTransmission ?? null,
      serverData?.ebayDominantBodyType ?? null,
      serverData?.ebayYearWidened ?? false,
      serverData?.ebayQ1Price ?? null,
      serverData?.ebayQ3Price ?? null,
      serverData?.marketcheckMedian ?? null,
      serverData?.marketcheckListingCount ?? 0,
      serverData?.marketcheckQ1 ?? null,
      serverData?.marketcheckQ3 ?? null,
    );
    if (result) {
      result.mileageAdjustmentPercent = getMileageAdjustment(mileage, age ?? 0);
      result.motAutoAdjustmentPercent = motAuto;
    }
    return result;
  }, [depEstimate, serverData, condition, advisoryCount, recentFailure, vehicle.colour, mileage, age]);

  return {
    newPrice,
    age,
    mileage,
    depEstimate,
    serverData,
    loading,
    valuation,
    estimatedValue: valuation?.estimatedValue ?? null,
  };
}
