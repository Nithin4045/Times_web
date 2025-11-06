"use client";

import React from "react";
import { useSearch } from "@/context/SearchContext";

export default function SearchModal() {
  const { isOpen, closeSearch } = useSearch();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6 relative">
        <button
          onClick={closeSearch}
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          ✖
        </button>
        <h2 className="text-lg font-semibold mb-3">Global Search</h2>
        <input
          type="text"
          placeholder="Type to search anything..."
          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
