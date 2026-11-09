"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Proyecto = {
  id: number;
  nombre: string;
  created_at?: string;
  lienzo?: Record<string, unknown>;
};

const CURRENT_PROJECT_KEY = "lienzoia-current-project-id";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [userName, setUserName] = useState("Usuario");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    load();

    function onChange() {
      load();
    }
    window.addEventListener("project-changed", onChange);
    return () => window.removeEventListener("project-changed", onChange);
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const meta = user.user_metadata as { nombre?: string };
    if (meta?.nombre) setUserName(meta.nombre);
    else if (user.email) setUserName(user.email.split("@")[0]);
    else setUserName("Usuario");

    const { data } = await supabase
      .from("proyectos")
      .select("id, nombre, created_at, lienzo")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setProyectos(data as Proyecto[]);
      const saved = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (saved) setCurrentId(Number(saved));
      else if (data.length > 0) {
        setCurrentId(data[0].id);
        localStorage.setItem(CURRENT_PROJECT_KEY, String(data[0].id));
      }
    }
  }

  function selectProject(id: number) {
    setCurrentId(id);
    localStorage.setItem(CURRENT_PROJECT_KEY, String(id));
    window.dispatchEvent(new Event("project-changed"));
    router.push("/dashboard/lienzo");
  }

  function nuevoProyecto() {
    router.push("/onboarding");
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("lienzoia-")) localStorage.removeItem(key);
    });
    router.push("/login");
  }

  function isActive(path: string) {
    return pathname === path
      ? "bg-white text-emerald-900 font-medium shadow-sm"
      : "text-stone-600 hover:bg-white/70";
  }

  function progreso(p: Proyecto) {
    const lienzo = p.lienzo || {};
    const keys = [
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
    const done = keys.filter((k) => {
      const v = lienzo[k];
      return Array.isArray(v) && v.some((x) => String(x).trim() !== "");
    }).length;
    return `${done}/9`;
  }

  return (
    <aside className="w-full md:w-64 bg-[#f0ece6] border-b md:border-b-0 md:border-r border-stone-200 flex flex-col p-5 min-h-[70px] md:min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-lg">
          L
        </div>
        <div>
          <p className="font-bold text-emerald-900 leading-tight">LienzoIA</p>
          <p className="text-[10px] tracking-widest text-emerald-700 uppercase">
            Repostería con visión
          </p>
        </div>
      </div>

      <nav className="flex md:flex-col gap-1 mb-4 overflow-x-auto">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl whitespace-nowrap ${isActive("/dashboard")}`}
        >
          <span>🏠</span> Resumen
        </Link>
        <Link
          href="/dashboard/lienzo"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl whitespace-nowrap ${isActive("/dashboard/lienzo")}`}
        >
          <span>📘</span> Mi lienzo
        </Link>
        <Link
          href="/dashboard/simulador"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl whitespace-nowrap ${isActive("/dashboard/simulador")}`}
        >
          <span>🧮</span> Simulador
        </Link>
        <Link
          href="/dashboard/reportes"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl whitespace-nowrap ${isActive("/dashboard/reportes")}`}
        >
          <span>📄</span> Reportes
        </Link>
      </nav>

      <div className="hidden md:block flex-1 overflow-y-auto border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
            Mis proyectos
          </p>
          <button
            onClick={nuevoProyecto}
            className="text-xs text-emerald-800 font-medium hover:underline"
          >
            + Nuevo
          </button>
        </div>

        {proyectos.length === 0 ? (
          <p className="text-xs text-stone-400 mt-2">Aún no tienes proyectos</p>
        ) : (
          <ul className="space-y-1">
            {proyectos.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => selectProject(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${
                    currentId === p.id
                      ? "bg-white shadow-sm text-emerald-900 font-medium"
                      : "hover:bg-white/60 text-stone-700"
                  }`}
                >
                  <span className="block truncate">{p.nombre}</span>
                  <span className="text-[10px] text-stone-400">
                    {progreso(p)}
                    {p.created_at
                      ? ` · ${new Date(p.created_at).toLocaleDateString("es-BO")}`
                      : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-stone-200 hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-700">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-stone-500">Mi cuenta</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-stone-400 hover:text-stone-700 px-1"
              aria-label="Menú"
            >
              •••
            </button>
            {menuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-stone-200 rounded-xl shadow-lg py-1 min-w-[150px] z-50">
                <button
                  onClick={cerrarSesion}
                  className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}