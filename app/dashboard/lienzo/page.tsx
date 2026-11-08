"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "lienzoia-canvas-answers";
const CURRENT_PROJECT_KEY = "lienzoia-current-project-id";

const blocks = [
  {
    id: "propuesta",
    title: "Propuesta de valor",
    question: "¿Qué te hace especial?",
    icon: "✨",
    color: "bg-amber-50 text-amber-700",
    questions: [
      "¿Qué valor entregas a tus clientes con tus productos?",
      "¿Qué problema o necesidad de tus clientes estás resolviendo?",
      "¿Qué hace especial a tus tortas, pasteles o postres frente a la competencia?",
    ],
  },
  {
    id: "clientes",
    title: "Segmentos de clientes",
    question: "¿A quién ayudas?",
    icon: "👥",
    color: "bg-emerald-50 text-emerald-700",
    questions: [
      "¿Para quién estás creando valor con tus productos de repostería?",
      "¿Quiénes son tus clientes más importantes? (familias, estudiantes, empresas, etc.)",
      "¿Hay algún grupo de clientes al que te gustaría llegar más?",
    ],
  },
  {
    id: "canales",
    title: "Canales",
    question: "¿Cómo te encuentran?",
    icon: "🏠",
    color: "bg-violet-50 text-violet-700",
    questions: [
      "¿A través de qué canales te encuentran tus clientes? (WhatsApp, Instagram, tienda física, etc.)",
      "¿Cómo prefieren hacer sus pedidos?",
      "¿Quieres agregar algún canal nuevo?",
    ],
  },
  {
    id: "relaciones",
    title: "Relaciones con clientes",
    question: "¿Cómo conectas?",
    icon: "💬",
    color: "bg-rose-50 text-rose-700",
    questions: [
      "¿Qué tipo de relación esperan tus clientes? (atención personalizada, respuesta rápida, etc.)",
      "¿Cómo mantienes el contacto después de una venta?",
      "¿Ofreces algún tipo de seguimiento o fidelización?",
    ],
  },
  {
    id: "ingresos",
    title: "Fuentes de ingresos",
    question: "¿Por qué pagan?",
    icon: "💰",
    color: "bg-green-50 text-green-700",
    questions: [
      "¿Por qué están dispuestos a pagar tus clientes?",
      "¿Cuáles son tus principales fuentes de ingresos? (tortas, cupcakes, pedidos especiales, etc.)",
      "¿Cómo prefieren pagar tus clientes?",
    ],
  },
  {
    id: "recursos",
    title: "Recursos clave",
    question: "¿Qué necesitas?",
    icon: "🧰",
    color: "bg-blue-50 text-blue-700",
    questions: [
      "¿Qué recursos clave necesitas para operar? (horno, utensilios, local, personal, etc.)",
      "¿Cuáles son los recursos más importantes para tu propuesta de valor?",
      "¿Hay algún recurso que te falte o quieras mejorar?",
    ],
  },
  {
    id: "actividades",
    title: "Actividades clave",
    question: "¿Qué haces?",
    icon: "📋",
    color: "bg-orange-50 text-orange-700",
    questions: [
      "¿Cuáles son las actividades más importantes de tu negocio? (hornear, decorar, vender, entregar, etc.)",
      "¿Qué actividades son esenciales para cumplir tu propuesta de valor?",
      "¿Hay alguna actividad que te tome demasiado tiempo?",
    ],
  },
  {
    id: "socios",
    title: "Asociaciones clave",
    question: "¿Quién te impulsa?",
    icon: "🤝",
    color: "bg-indigo-50 text-indigo-700",
    questions: [
      "¿Quiénes son tus socios o proveedores clave?",
      "¿De quiénes dependes para conseguir insumos (harina, azúcar, etc.)?",
      "¿Tienes alguna alianza importante (delivery, locales, etc.)?",
    ],
  },
  {
    id: "costos",
    title: "Estructura de costes",
    question: "¿Qué pagas?",
    icon: "📊",
    color: "bg-stone-100 text-stone-700",
    questions: [
      "¿Cuáles son los costos más importantes de tu negocio?",
      "¿Qué recursos o actividades te resultan más caros?",
      "¿Hay costos que varían mucho (insumos, gas, etc.)?",
    ],
  },
];

function isBlockCompleted(answers: Record<string, string[]>, blockId: string) {
  const vals = answers[blockId];
  return !!vals && vals.some((a) => a.trim() !== "");
}

function isBlockUnlocked(answers: Record<string, string[]>, index: number) {
  if (index === 0) return true;
  return isBlockCompleted(answers, blocks[index - 1].id);
}

export default function LienzoPage() {
  const [selectedBlock, setSelectedBlock] = useState<(typeof blocks)[0] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [meta, setMeta] = useState({
    nombre: "",
    queVende: "",
    descripcion: "",
  });

  useEffect(() => {
    async function loadProject() {
      setLoaded(false);
      try {
        let projectId = localStorage.getItem(CURRENT_PROJECT_KEY);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !projectId) {
          const { data } = await supabase
            .from("proyectos")
            .select("id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            projectId = String(data[0].id);
            localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
          }
        }

        if (projectId) {
          const { data } = await supabase
            .from("proyectos")
            .select("nombre, lienzo")
            .eq("id", Number(projectId))
            .single();

          if (data?.lienzo && typeof data.lienzo === "object") {
            const raw = data.lienzo as Record<string, unknown>;
            const { _meta, ...rest } = raw;

            setAnswers((rest as Record<string, string[]>) || {});

            const m = (_meta || {}) as {
              queVende?: string;
              descripcion?: string;
            };
            setMeta({
              nombre: data.nombre || "",
              queVende: m.queVende || "",
              descripcion: m.descripcion || "",
            });
          } else {
            setAnswers({});
            setMeta({
              nombre: data?.nombre || "",
              queVende: "",
              descripcion: "",
            });
          }

          localStorage.setItem(
            `${STORAGE_KEY}-${projectId}`,
            JSON.stringify(
              data?.lienzo && typeof data.lienzo === "object" ? data.lienzo : {}
            )
          );
        } else {
          setAnswers({});
        }
      } catch (e) {
        console.error(e);
        setAnswers({});
      } finally {
        setLoaded(true);
      }
    }

    loadProject();

    function onChange() {
      loadProject();
    }
    window.addEventListener("project-changed", onChange);
    return () => window.removeEventListener("project-changed", onChange);
  }, []);

  function openBlock(block: (typeof blocks)[0], index: number) {
    if (!isBlockUnlocked(answers, index)) {
      setLockMessage(`Completa y guarda primero: "${blocks[index - 1].title}"`);
      return;
    }
    setLockMessage("");
    setSelectedBlock(block);
    setCurrentAnswers(answers[block.id] || block.questions.map(() => ""));
    setAiError("");
  }

  function closeModal() {
    setSelectedBlock(null);
    setAiError("");
  }

  async function borrarTodo() {
    const ok = window.confirm(
      "¿Seguro que quieres borrar todas las respuestas del lienzo? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    const vacio: Record<string, string[]> = {};
    setAnswers(vacio);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const projectId = localStorage.getItem(CURRENT_PROJECT_KEY);

      if (user && projectId) {
        localStorage.setItem(`${STORAGE_KEY}-${projectId}`, JSON.stringify(vacio));
        await supabase
          .from("proyectos")
          .update({ lienzo: vacio })
          .eq("id", Number(projectId))
          .eq("user_id", user.id);
        window.dispatchEvent(new Event("project-changed"));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function saveAnswers() {
    if (!selectedBlock) return;

    const newAnswers = {
      ...answers,
      [selectedBlock.id]: currentAnswers,
    };

    setAnswers(newAnswers);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSelectedBlock(null);
        return;
      }

      let projectId = localStorage.getItem(CURRENT_PROJECT_KEY);

      if (!projectId) {
        const { data } = await supabase
          .from("proyectos")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          projectId = String(data[0].id);
          localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
        }
      }

      if (projectId) {
        // Guardar meta + respuestas juntas
        const lienzoCompleto = {
          ...newAnswers,
          _meta: {
            queVende: meta.queVende,
            descripcion: meta.descripcion,
          },
        };

        localStorage.setItem(
          `${STORAGE_KEY}-${projectId}`,
          JSON.stringify(lienzoCompleto)
        );

        const { error } = await supabase
          .from("proyectos")
          .update({ lienzo: lienzoCompleto })
          .eq("id", Number(projectId))
          .eq("user_id", user.id);

        if (error) console.error("Error Supabase:", error.message);
        else {
          console.log("Guardado en proyecto", projectId);
          window.dispatchEvent(new Event("project-changed"));
        }
      }
    } catch (e) {
      console.error(e);
    }

    setSelectedBlock(null);
  }

  function updateAnswer(index: number, value: string) {
    setCurrentAnswers((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  async function sugerirConIA() {
    if (!selectedBlock) return;
    setLoadingAI(true);
    setAiError("");

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockTitle: selectedBlock.title,
          questions: selectedBlock.questions,
          contexto: {
            nombreNegocio: meta.nombre,
            queVende: meta.queVende,
            descripcion: meta.descripcion,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "No se pudo obtener la sugerencia");
        return;
      }

      if (data.suggestions && Array.isArray(data.suggestions)) {
        setCurrentAnswers(data.suggestions);
      } else {
        setAiError("La IA no devolvió sugerencias válidas");
      }
    } catch (e) {
      console.error(e);
      setAiError("Error de conexión con la IA");
    } finally {
      setLoadingAI(false);
    }
  }

  const completedCount = blocks.filter((b) =>
    isBlockCompleted(answers, b.id)
  ).length;

  const currentStep =
    blocks.findIndex(
      (b, i) => isBlockUnlocked(answers, i) && !isBlockCompleted(answers, b.id)
    ) + 1 || (completedCount === 9 ? 9 : completedCount + 1);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <p className="text-stone-500">Cargando tu lienzo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-800 flex flex-col md:flex-row">
      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <p className="text-sm font-medium text-amber-700 tracking-wide">
              ✨ GUÍA INTELIGENTE
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-800">
              El lienzo de tu negocio
            </h1>
            <p className="mt-2 text-stone-500 max-w-2xl text-sm sm:text-base">
              Completa los bloques en orden. Empieza por la{" "}
              <strong>Propuesta de valor</strong>. Los siguientes se desbloquean al
              guardar.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium">
                {completedCount} / 9 completados
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 text-sm font-medium">
                Paso {Math.min(currentStep, 9)} de 9
              </span>
            </div>

            <div className="mt-3">
              <button
                onClick={borrarTodo}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 transition"
              >
                🗑️ Borrar todas las respuestas
              </button>
            </div>

            {lockMessage && (
              <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                🔒 {lockMessage}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {blocks.map((block, index) => {
              const completed = isBlockCompleted(answers, block.id);
              const unlocked = isBlockUnlocked(answers, index);

              return (
                <div
                  key={block.id}
                  className={`rounded-2xl border p-5 shadow-sm transition flex flex-col ${
                    unlocked
                      ? "bg-white border-stone-200 hover:shadow-md"
                      : "bg-stone-100 border-stone-200 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${
                        unlocked ? block.color : "bg-stone-200 text-stone-400"
                      }`}
                    >
                      {unlocked ? block.icon : "🔒"}
                    </div>
                    <span className="text-xs font-medium text-stone-400">
                      {index + 1}/9
                    </span>
                  </div>

                  <h3 className="font-bold text-stone-800 text-lg">{block.title}</h3>
                  <p className="text-sm text-stone-500 mt-1 mb-5 flex-1">
                    {block.question}
                  </p>

                  <button
                    onClick={() => openBlock(block, index)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition ${
                      !unlocked
                        ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                        : completed
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
                    }`}
                  >
                    {!unlocked
                      ? "Bloqueado"
                      : completed
                      ? "✓ Editar respuestas"
                      : "✨ Responder paso a paso"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selectedBlock && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="p-5 sm:p-6 border-b border-stone-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500">{selectedBlock.question}</p>
                  <h2 className="text-xl font-bold text-stone-800 mt-1">
                    {selectedBlock.title}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="text-stone-400 hover:text-stone-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <button
                onClick={sugerirConIA}
                disabled={loadingAI}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white py-2.5 text-sm font-medium hover:bg-emerald-800 disabled:opacity-60 transition"
              >
                {loadingAI ? "Pensando..." : "✨ Sugerir con IA"}
              </button>

              {aiError && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">
                  {aiError}
                </p>
              )}

              {selectedBlock.questions.map((q, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    {q}
                  </label>
                  <textarea
                    value={currentAnswers[index] || ""}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    rows={3}
                    placeholder="Escribe tu respuesta o usa la IA..."
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 bg-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6 border-t border-stone-100 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveAnswers}
                className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
              >
                Guardar respuestas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}