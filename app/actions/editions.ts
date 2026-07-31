"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENT_EDITION_COOKIE, DEPARTMENTS } from "@/lib/constants";
import { assertNotDemo } from "@/lib/demo";

export async function createEdition(formData: FormData) {
  assertNotDemo();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;
  const targetParticipants = Number(formData.get("target_participants") ?? 500) || 500;

  const { data: edition, error } = await supabase
    .from("editions")
    .insert({
      organization_id: membership.organization_id,
      name: name || "Untitled Edition",
      theme,
      start_date: startDate,
      end_date: endDate,
      target_participants: targetParticipants,
      status: "draft",
    })
    .select()
    .single();

  if (error || !edition) {
    throw new Error(error?.message ?? "Failed to create edition");
  }

  const { error: deptError } = await supabase.from("departments").insert(
    DEPARTMENTS.map((d) => ({
      edition_id: edition.id,
      key: d.key,
      name: d.name,
    }))
  );
  if (deptError) throw new Error(`Edition created, but failed to set up departments: ${deptError.message}`);

  revalidatePath("/editions");
}

export async function updateEditionStatus(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const status = String(formData.get("status"));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("editions")
    .update({ status })
    .eq("id", editionId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to change this edition's status.");
  revalidatePath("/editions");
}

export async function archiveEdition(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("editions")
    .update({ status: "archived" })
    .eq("id", editionId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to archive this edition.");
  revalidatePath("/editions");
}

export async function copyEdition(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("editions")
    .select("*")
    .eq("id", editionId)
    .single();
  if (!source) return;

  const { data: sourceDepartments } = await supabase
    .from("departments")
    .select("*")
    .eq("edition_id", editionId);

  const { data: newEdition, error } = await supabase
    .from("editions")
    .insert({
      organization_id: source.organization_id,
      name: `${source.name} (Copy)`,
      theme: source.theme,
      status: "draft",
      start_date: source.start_date,
      end_date: source.end_date,
      venue: source.venue,
      venue_address: source.venue_address,
      target_participants: source.target_participants,
      profitability_target_percent: source.profitability_target_percent,
      registration_deadline: source.registration_deadline,
      test_run_date: source.test_run_date,
      enable_waitlist: source.enable_waitlist,
    })
    .select()
    .single();

  if (error || !newEdition) return;

  const { error: deptError } = await supabase.from("departments").insert(
    (sourceDepartments ?? []).map((d) => ({
      edition_id: newEdition.id,
      key: d.key,
      name: d.name,
      lead_name: d.lead_name,
    }))
  );
  if (deptError) throw new Error(`Edition copied, but failed to set up departments: ${deptError.message}`);

  revalidatePath("/editions");
}

export async function setCurrentEditionAndGo(formData: FormData) {
  const editionId = String(formData.get("edition_id"));
  const destination = String(formData.get("destination") ?? "/oc");
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_EDITION_COOKIE, editionId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(destination);
}

export async function updateWaitlistSetting(formData: FormData) {
  assertNotDemo();
  const editionId = String(formData.get("edition_id"));
  const enabled = formData.get("enable_waitlist") === "on";
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("editions")
    .update({ enable_waitlist: enabled })
    .eq("id", editionId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to change this edition's settings.");
  revalidatePath("/oc");
}

export async function updateDepartmentLead(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const leadName = String(formData.get("lead_name") ?? "").trim();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .update({ lead_name: leadName || null })
    .eq("id", departmentId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to update this department.");
  revalidatePath("/", "layout");
}
