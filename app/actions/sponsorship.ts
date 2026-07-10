"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertNotDemo } from "@/lib/demo";

export async function addSponsor(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const editionId = String(formData.get("edition_id"));
  const name = String(formData.get("name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0) || 0;
  const isVvip = formData.get("is_vvip") === "on";
  const path = String(formData.get("path") ?? "/sponsorship");
  if (!name) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .insert({
      department_id: departmentId,
      edition_id: editionId,
      name,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      amount,
      is_vvip: isVvip,
      stage: "lead",
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to add sponsors here.");
  revalidatePath(path);
}

export async function updateSponsorStage(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const stage = String(formData.get("stage"));
  const path = String(formData.get("path") ?? "/sponsorship");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .update({ stage })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to update this sponsor.");
  revalidatePath(path);
}

export async function deleteSponsor(formData: FormData) {
  assertNotDemo();
  const id = String(formData.get("id"));
  const path = String(formData.get("path") ?? "/sponsorship");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to delete this sponsor.");
  revalidatePath(path);
}

export async function addVvipGuest(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const editionId = String(formData.get("edition_id"));
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const path = String(formData.get("path") ?? "/sponsorship");
  if (!name) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vvip_guests")
    .insert({
      department_id: departmentId,
      edition_id: editionId,
      name,
      title: title || null,
      organization: organization || null,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to add VVIP guests here.");
  revalidatePath(path);
}

export async function addSponsorPackage(formData: FormData) {
  assertNotDemo();
  const departmentId = String(formData.get("department_id"));
  const editionId = String(formData.get("edition_id"));
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0) || 0;
  const benefits = String(formData.get("benefits") ?? "").trim();
  const maxSlots = formData.get("max_slots") ? Number(formData.get("max_slots")) : null;
  const path = String(formData.get("path") ?? "/sponsorship");
  if (!name) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsor_packages")
    .insert({
      department_id: departmentId,
      edition_id: editionId,
      name,
      price,
      benefits: benefits || null,
      max_slots: maxSlots,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You don't have permission to add sponsor packages here.");
  revalidatePath(path);
}
