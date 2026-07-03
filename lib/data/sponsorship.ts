import { createClient } from "@/lib/supabase/server";
import { isDemo } from "@/lib/demo";
import type { Sponsor, SponsorPackage, VvipGuest } from "@/lib/types";

export async function getSponsors(departmentId: string): Promise<Sponsor[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsors")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Sponsor[];
}

export async function getVvipGuests(departmentId: string): Promise<VvipGuest[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("vvip_guests")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as VvipGuest[];
}

export async function getSponsorPackages(departmentId: string): Promise<SponsorPackage[]> {
  if (isDemo()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("sponsor_packages")
    .select("*")
    .eq("department_id", departmentId)
    .order("created_at", { ascending: false });
  return (data ?? []) as SponsorPackage[];
}
