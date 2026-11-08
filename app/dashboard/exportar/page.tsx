"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CANVAS_KEY = "lienzoia-canvas-answers";

const blockLabels: Record<string, string> = {
  socios: "Socios clave",
  actividades: "Actividades clave",
  recursos: "Recursos clave",
  propuesta: "Propuesta de valor",
  relaciones: "Relaciones con clientes",
  canales: "Canales",
  clientes: "Segmentos de clientes",
  costos: "Estructura de costos",
  ingresos: "Fuentes de ingresos",
};

export default function ExportarPage() {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CANVAS_KEY);
      if (saved) setAnswers(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  function getText(id: string) {
    const arr = answers[id];
    if (!arr || arr.length === 0) return "Sin completar";
    return arr.filter((a) => a.trim()).join("\n") || "Sin completar";
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p>Cargando lienzo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-6 print:p-0 print:bg-white">
      {/* Botones (no se imprimen) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap gap-3 print:hidden">
        <Link
          href="/dashboard/reportes"
          className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-sm hover:bg-stone-50"
        >
          ← Volver a Reportes
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800"
        >
          🖨 Imprimir / Guardar como PDF
        </button>
      </div>

      {/* Título */}
      <div className="max-w-5xl mx-auto mb-4 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Lienzo Canvas — Dulce Sur</h1>
        <p className="text-sm text-stone-500">
          Repostería artesanal · Zona Sur, Cochabamba · {new Date().toLocaleDateString("es-BO")}
        </p>
      </div>

      {/* Lienzo Canvas clásico (9 bloques) */}
      <div className="max-w-5xl mx-auto border-2 border-stone-800 bg-white grid grid-cols-5 grid-rows-[1fr_1fr_auto] min-h-[520px] text-xs">
        {/* Fila 1 */}
        {/* Socios clave */}
        <div className="border border-stone-400 p-2 row-span-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Socios clave
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("socios")}</p>
        </div>

        {/* Actividades clave */}
        <div className="border border-stone-400 p-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Actividades clave
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("actividades")}</p>
        </div>

        {/* Propuesta de valor */}
        <div className="border border-stone-400 p-2 row-span-2 flex flex-col bg-amber-50/50">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Propuesta de valor
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("propuesta")}</p>
        </div>

        {/* Relaciones con clientes */}
        <div className="border border-stone-400 p-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Relaciones con clientes
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("relaciones")}</p>
        </div>

        {/* Segmentos de clientes */}
        <div className="border border-stone-400 p-2 row-span-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Segmentos de clientes
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("clientes")}</p>
        </div>

        {/* Recursos clave */}
        <div className="border border-stone-400 p-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Recursos clave
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("recursos")}</p>
        </div>

        {/* Canales */}
        <div className="border border-stone-400 p-2 flex flex-col">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Canales
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("canales")}</p>
        </div>

        {/* Estructura de costos */}
        <div className="border border-stone-400 p-2 col-span-2 flex flex-col min-h-[100px]">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Estructura de costos
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("costos")}</p>
        </div>

        {/* Fuentes de ingresos */}
        <div className="border border-stone-400 p-2 col-span-3 flex flex-col min-h-[100px]">
          <p className="font-bold text-stone-700 mb-1 border-b border-stone-300 pb-1">
            Fuentes de ingresos
          </p>
          <p className="whitespace-pre-wrap text-stone-600 flex-1">{getText("ingresos")}</p>
        </div>
      </div>

      <p className="max-w-5xl mx-auto mt-4 text-center text-xs text-stone-400 print:mt-2">
        Generado por LienzoIA · Planificación para PyMEs de repostería
      </p>
    </div>
  );
}