"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../components/MainLayout";
import ApplyForLeave from "../components/ApplyForLeave"; // Srilekha: the form
import LeaveHistory from "../components/LeaveHistory"; // Tintu: the history table

export default function LeavePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // every logged-in employee can use this page
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setReady(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!ready) return null;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="inline-block border-b-[3px] border-green-500 pb-1 text-2xl font-medium text-slate-100 md:text-3xl">
          Leave Management
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Apply for leave and follow the status of your requests.
        </p>
      </div>

      <>
        {/* Srilekha's Apply for Leave form */}
        <ApplyForLeave />
        {/* Tintu's Leave History table */}
        <LeaveHistory />
      </>
    </MainLayout>
  );
}
