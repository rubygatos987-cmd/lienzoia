import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blockTitle, questions, contexto } = body;

    if (!blockTitle || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Faltan blockTitle o questions" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const negocio = [
      contexto?.nombreNegocio
        ? `Nombre del negocio: ${contexto.nombreNegocio}`
        : "",
      contexto?.queVende ? `Qué vende: ${contexto.queVende}` : "",
      contexto?.descripcion ? `Descripción: ${contexto.descripcion}` : "",
      "Ubicación: Zona Sur de Cochabamba, Bolivia",
    ]
      .filter(Boolean)
      .join("\n");

    const listaPreguntas = questions
      .map((q: string, i: number) => `${i + 1}. ${q}`)
      .join("\n");

    const prompt = `Eres un consultor de negocios especializado en repostería y PyMEs bolivianas.

DATOS DEL EMPRENDIMIENTO:
${negocio || "Repostería artesanal en Cochabamba"}

BLOQUE DEL LIENZO CANVAS: ${blockTitle}

INSTRUCCIONES IMPORTANTES:
- Respuestas ESPECÍFICAS para este negocio (usa el producto que vende: si son brownies, habla de brownies; si son queques, de queques; si es hojaldre, de hojaldre).
- NO uses frases genéricas como "ofrecer calidad" o "buen servicio" solas.
- Incluye detalles locales (Cochabamba, barrios, WhatsApp, ferias, precios en bolivianos cuando tenga sentido).
- Cada respuesta debe ser distinta y práctica (1 a 3 oraciones).
- Evita repetir las mismas ideas entre respuestas.

PREGUNTAS A RESPONDER:
${listaPreguntas}

Devuelve ÚNICAMENTE un JSON válido con este formato (sin markdown):
{"suggestions":["respuesta 1","respuesta 2","respuesta 3"]}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Eres un experto en Business Model Canvas para reposterías en Bolivia. Respondes SOLO con JSON válido, sin texto extra ni markdown.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 900,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Groq error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Error al consultar la IA" },
        { status: 500 }
      );
    }

    const text: string = data.choices?.[0]?.message?.content || "";
    let suggestions: string[] = [];

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions;
      } else if (Array.isArray(parsed)) {
        suggestions = parsed;
      }
    } catch {
      suggestions = text
        .split("\n")
        .map((l) =>
          l
            .replace(/^\d+[\.\)]\s*/, "")
            .replace(/^[-•*]\s*/, "")
            .trim()
        )
        .filter((l) => l.length > 8)
        .slice(0, questions.length);
    }

    while (suggestions.length < questions.length) {
      suggestions.push("");
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, questions.length),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}