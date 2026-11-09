"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const CURRENT_PROJECT_KEY = "lienzoia-current-project-id";

type Proyecto = {
  id: number;
  nombre: string;
  lienzo?: Record<string, unknown>;
};

function contarCompletados(lienzo?: Record<string, unknown>) {
  if (!lienzo) return 0;
  const ids = [
    "propuesta",
    "clientes",
    "canales",
    "relaciones",
    "ingresos",
    "recursos",
    "actividades",
    "socios",
    "costos",
  ];
  return ids.filter((id) => {
    const v = lienzo[id];
    return Array.isArray(v) && v.some((x) => String(x).trim() !== "");
  }).length;
}

export default function DashboardPage() {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [totalProyectos, setTotalProyectos] = useState(0);
  const [userName, setUserName] = useState("Usuario");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoaded(true);
          return;
        }

       const meta = user.user_metadata as { nombre?: string };
       if (meta?.nombre) setUserName(meta.nombre);
       else if (user.email) setUserName(user.email.split("@")[0]);
       else setUserName("Usuario");
       
        const { data: lista } = await supabase
          .from("proyectos")
          .select("id, nombre, lienzo")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (lista) {
          setTotalProyectos(lista.length);
          const savedId = localStorage.getItem(CURRENT_PROJECT_KEY);
          const actual =
            lista.find((p) => String(p.id) === savedId) || lista[0] || null;
          if (actual) {
            setProyecto(actual as Proyecto);
            localStorage.setItem(CURRENT_PROJECT_KEY, String(actual.id));
          }
        }
      } catch (e) {
        console.error(e);
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

  const completedCount = contarCompletados(proyecto?.lienzo);
  const progressPercent = Math.round((completedCount / 9) * 100);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <p className="text-stone-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-800 flex">
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-700 tracking-wide">
              ✨ BUENOS DÍAS, {userName.toUpperCase()}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-stone-800">
              Dale forma a tu idea dulce.
            </h1>
            <p className="mt-2 text-stone-500 max-w-xl">
              Organiza tu negocio, toma mejores decisiones y convierte tu pasión
              por la repostería en un proyecto sostenible.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Progreso del lienzo</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {progressPercent}%
              </p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-xs text-amber-700 font-medium">Proyectos activos</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {totalProyectos}
              </p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
              <p className="text-xs text-violet-700 font-medium">Última simulación</p>
              <p className="text-2xl font-bold text-violet-900 mt-1">Hoy</p>
            </div>
            <div className="bg-stone-100 rounded-2xl p-4 border border-stone-200">
              <p className="text-xs text-stone-600 font-medium">Viabilidad actual</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">
                {progressPercent >= 70
                  ? "Favorable"
                  : progressPercent >= 30
                  ? "En proceso"
                  : "Inicial"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                    Proyecto principal
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {proyecto?.nombre || "Sin proyecto"}
                  </h2>
                  <p className="text-sm text-stone-500">
                    Repostería artesanal · Zona Sur, Cochabamba
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-stone-500">Avance del proyecto</span>
                  <span className="font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/lienzo"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-sm font-medium"
                >
                  📘 Continuar lienzo
                  <span className="text-stone-400 text-xs">
                    {completedCount} de 9 bloques
                  </span>
                </Link>
                <Link
                  href="/dashboard/simulador"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-sm font-medium"
                >
                  🧮 Ver simulación
                </Link>
              </div>
            </div>

            <div className="bg-emerald-800 text-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  ✨
                </div>
                <h3 className="text-lg font-bold leading-snug">
                  Tu próximo paso está a una pregunta de distancia.
                </h3>
                <p className="mt-3 text-emerald-100 text-sm">
                  Usa el asistente inteligente para descubrir oportunidades y
                  completar tu modelo de negocio.
                </p>
              </div>
              <Link
                href="/dashboard/lienzo"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
              >
                Explorar el asistente →
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Tu espacio de trabajo</h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                href="/dashboard/lienzo"
                className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl mb-3">
                  📘
                </div>
                <h4 className="font-semibold">Lienzo inteligente</h4>
                <p className="text-sm text-stone-500 mt-1">
                  Define cómo funciona tu negocio con ayuda guiada.
                </p>
              </Link>

              <Link
                href="/dashboard/simulador"
                className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl mb-3">
                  🧮
                </div>
                <h4 className="font-semibold">Simulador financiero</h4>
                <p className="text-sm text-stone-500 mt-1">
                  Prueba escenarios y conoce la salud de tu proyecto.
                </p>
              </Link>

              <Link
                href="/dashboard/reportes"
                className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-xl mb-3">
                  📄
                </div>
                <h4 className="font-semibold">Reporte de viabilidad</h4>
                <p className="text-sm text-stone-500 mt-1">
                  Resume tus hallazgos para tomar acción.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}