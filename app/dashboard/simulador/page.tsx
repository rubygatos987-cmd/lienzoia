"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const CURRENT_PROJECT_KEY = "lienzoia-current-project-id";

type SimuladorData = {
  pedidos: number;
  precio: number;
  costoPedido: number;
  costosFijos: number;
  inversion: number;
};

const defaultData: SimuladorData = {
  pedidos: 80,
  precio: 120,
  costoPedido: 42,
  costosFijos: 2200,
  inversion: 12000,
};

export default function SimuladorPage() {
  const [data, setData] = useState<SimuladorData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoaded(false);
      try {
        let pid = localStorage.getItem(CURRENT_PROJECT_KEY);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoaded(true);
          return;
        }

        if (!pid) {
          const { data: lista } = await supabase
            .from("proyectos")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);
          if (lista && lista.length > 0) {
            pid = String(lista[0].id);
            localStorage.setItem(CURRENT_PROJECT_KEY, pid);
          }
        }

        setProjectId(pid);

        if (pid) {
          const { data: proy } = await supabase
            .from("proyectos")
            .select("simulador")
            .eq("id", Number(pid))
            .single();

          if (proy?.simulador && typeof proy.simulador === "object") {
            const s = proy.simulador as Partial<SimuladorData>;
            setData({
              pedidos: s.pedidos ?? defaultData.pedidos,
              precio: s.precio ?? defaultData.precio,
              costoPedido: s.costoPedido ?? defaultData.costoPedido,
              costosFijos: s.costosFijos ?? defaultData.costosFijos,
              inversion: s.inversion ?? defaultData.inversion,
            });
          } else {
            setData(defaultData);
          }
        } else {
          setData(defaultData);
        }
      } catch (e) {
        console.error(e);
        setData(defaultData);
      } finally {
        setLoaded(true);
      }
    }

    load();

    function onChange() {
      load();
    }
    window.addEventListener("project-changed", onChange);
    return () => window.removeEventListener("project-changed", onChange);
  }, []);

  // Guardado automático en Supabase (por proyecto)
  useEffect(() => {
    if (!loaded || !projectId) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("proyectos")
          .update({ simulador: data })
          .eq("id", Number(projectId))
          .eq("user_id", user.id);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 600); // espera 0.6s después del último cambio

    return () => clearTimeout(timer);
  }, [data, loaded, projectId]);

  function update(field: keyof SimuladorData, value: number) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  const ingresos = data.pedidos * data.precio;
  const costosVariables = data.pedidos * data.costoPedido;
  const ganancia = ingresos - costosVariables - data.costosFijos;
  const margen = ingresos > 0 ? ((ganancia / ingresos) * 100).toFixed(1) : "0";
  const puntoEquilibrio =
    data.precio - data.costoPedido > 0
      ? Math.ceil(data.costosFijos / (data.precio - data.costoPedido))
      : 0;
  const roi =
    data.inversion > 0 ? ((ganancia / data.inversion) * 100).toFixed(1) : "0";

  const pesimista = Math.round(ganancia * 0.8);
  const realista = ganancia;
  const optimista = Math.round(ganancia * 1.2);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <p className="text-stone-500">Cargando simulador...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-800 flex">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-medium text-stone-500 tracking-wide">
              🧮 DECISIONES CON NÚMEROS
            </p>
            <h1 className="mt-2 text-3xl font-bold">Simulador financiero</h1>
            <p className="mt-2 text-stone-500 max-w-2xl">
              Ajusta tus supuestos en bolivianos. Los resultados se calculan y
              guardan automáticamente para este proyecto.
              {saving && (
                <span className="ml-2 text-emerald-700 text-sm">Guardando...</span>
              )}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8">
            <h2 className="font-bold text-amber-900 mb-1">Simula un caso real</h2>
            <p className="text-sm text-amber-800 mb-5">
              Estos tres datos son la base del cálculo. Úsalos según tu
              emprendimiento (tortas, queques, brownies, etc.).
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Pedidos al mes
                </label>
                <input
                  type="number"
                  value={data.pedidos}
                  onChange={(e) => update("pedidos", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-800 outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-amber-800/80 mt-1.5">
                  ¿Cuántos pedidos crees vender en un mes?
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Precio promedio (Bs)
                </label>
                <input
                  type="number"
                  value={data.precio}
                  onChange={(e) => update("precio", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-800 outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-amber-800/80 mt-1.5">
                  ¿Cuánto cobras en promedio por cada pedido?
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">
                  Costo por pedido (Bs)
                </label>
                <input
                  type="number"
                  value={data.costoPedido}
                  onChange={(e) => update("costoPedido", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-800 outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-amber-800/80 mt-1.5">
                  ¿Cuánto te cuesta producir uno? (harina, azúcar, empaque…)
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="font-bold mb-4">Tus supuestos mensuales</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-stone-500">
                    Ingresos mensuales (calculado)
                  </label>
                  <input
                    type="number"
                    value={ingresos}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-500">
                    Costos variables (calculado)
                  </label>
                  <input
                    type="number"
                    value={costosVariables}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-stone-800"
                  />
                </div>
                <div>
                  <label className="text-sm text-stone-500">
                    Costos fijos (alquiler y servicios)
                  </label>
                  <input
                    type="number"
                    value={data.costosFijos}
                    onChange={(e) =>
                      update("costosFijos", Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-800 outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Gastos que pagas aunque no vendas (alquiler, luz, gas…)
                  </p>
                </div>
                <div>
                  <label className="text-sm text-stone-500">Inversión inicial</label>
                  <input
                    type="number"
                    value={data.inversion}
                    onChange={(e) =>
                      update("inversion", Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-stone-800 outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Dinero que invertiste para arrancar (horno, utensilios, etc.)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <p className="text-sm text-emerald-700">Ganancia mensual</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  Bs {ganancia.toLocaleString()}
                </p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <p className="text-sm text-amber-700">Margen neto</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {margen}%
                </p>
              </div>
              <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100">
                <p className="text-sm text-violet-700">Punto de equilibrio</p>
                <p className="text-2xl font-bold text-violet-900 mt-1">
                  {puntoEquilibrio} pedidos
                </p>
              </div>
              <div className="bg-stone-100 rounded-2xl p-5 border border-stone-200">
                <p className="text-sm text-stone-600">ROI mensual</p>
                <p className="text-2xl font-bold text-stone-800 mt-1">{roi}%</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">Escenarios comparativos</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
                <p className="text-sm font-medium text-rose-700">Pesimista</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">
                  Bs {pesimista.toLocaleString()}
                </p>
                <p className="text-xs text-rose-600 mt-1">-20%</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700">Realista</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  Bs {realista.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 mt-1">Base actual</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                <p className="text-sm font-medium text-amber-700">Optimista</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  Bs {optimista.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 mt-1">+20%</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}