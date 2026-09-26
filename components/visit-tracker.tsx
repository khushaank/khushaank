"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase/public";
export function VisitTracker() { useEffect(() => { if (!sessionStorage.getItem("visit-recorded")) { supabase?.rpc("record_visit"); sessionStorage.setItem("visit-recorded", "1"); } }, []); return null; }
