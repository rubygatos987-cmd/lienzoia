"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const SIMULADOR_KEY = "lienzoia-simulador-v2";
const CANVAS_KEY = "lienzoia-canvas-answers";

export default function ReportesPage() {
  const [ganancia, setGanancia] = useState(3300);
  const [margen, setMargen] = useState("38.8");
  const [roi, setRoi] = useState("27.5");
  const [completedBlocks, setCompletedBlocks] = useState(0);

  useEffect(() => {
    try {
      const sim = localStorage.getItem(SIMULADOR_KEY);
      if (sim) {
        const data = JSON.parse(sim);
        const ingresos = (data.pedidos ?? 80) * (data.precio ?? 120);
        const costosVar = (data.pedidos ?? 80) * (data.costoPedido ?? 42);
        const costosFijos = data.costosFijos ?? 2200;
        const inversion = data.inversion ?? 12000;
        const g = ingresos - costosVar - costosFijos;
        setGanancia(g);
        setMargen(ingresos > 0 ? ((g / ingresos) * 100).toFixed(1) : "0");
        setRoi(inversion > 0 ? ((g / inversion) * 100).toFixed(1) : "0");
      }
    } catch {}

    try {
      const canvas = localStorage.getItem(CANVAS_KEY);
      if (canvas) {
        const answers = JSON.parse(canvas) as Record<string, string[]>;
        const count = Object.keys(answers).filter(
          (id) => answers[id]?.some((a) => a.trim() !== "")
        ).length;
        setCompletedBlocks(count);
      }
    } catch {}
  }, []);

  const esFavorable = ganancia > 0;

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-800 flex">
     
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-medium text-stone-500 tracking-wide">
              📄 RESUMEN EJECUTIVO
            </p>
            <h1 className="mt-2 text-3xl font-bold">Reporte de viabilidad</h1>
            <p className="mt-1 text-stone-500">Dulce Sur · Actualizado hoy</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-sm text-stone-500">Resultado mensual estimado</p>
                <p className="text-4xl font-bold text-emerald-800 mt-1">
                  Bs {ganancia.toLocaleString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  esFavorable
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {esFavorable ? "Favorable" : "Revisar"}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-sm text-stone-500">Margen neto</p>
                <p className="text-2xl font-bold text-stone-800 mt-1">{margen}%</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-sm text-stone-500">ROI mensual</p>
                <p className="text-2xl font-bold text-stone-800 mt-1">{roi}%</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-sm text-stone-500">Canvas completado</p>
                <p className="text-2xl font-bold text-stone-800 mt-1">
                  {completedBlocks}/9
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <p className="font-semibold text-emerald-900 flex items-center gap-2">
                💡 Recomendación inteligente
              </p>
              <p className="text-sm text-emerald-800 mt-2">
                {esFavorable
                  ? "Tu modelo muestra potencial. Protege tu margen actual revisando precios cada mes según el costo de insumos y prioriza los productos más rentables."
                  : "Revisa tus costos fijos y el precio de tus productos. Un pequeño ajuste puede mejorar significativamente la rentabilidad."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => (window.location.href = "/dashboard/exportar")}
                className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                Ver / Descargar Lienzo Canvas
              </button>
              <button
                onClick={() => {
                  const texto = `Mi reporte LienzoIA: Ganancia Bs ${ganancia.toLocaleString()}, Margen ${margen}%, ROI ${roi}%`;
                  if (navigator.share) {
                    navigator.share({ title: "Reporte LienzoIA", text: texto });
                  } else {
                    navigator.clipboard.writeText(texto);
                    alert("Texto copiado al portapapeles");
                  }
                }}
                className="px-5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium hover:bg-stone-50"
              >
                ↗ Compartir
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}