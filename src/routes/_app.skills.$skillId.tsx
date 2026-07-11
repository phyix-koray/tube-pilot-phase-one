import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { mockSkills } from "@/mock/data";

export const Route = createFileRoute("/_app/skills/$skillId")({
  loader: ({ params }) => {
    const skill = mockSkills.find((s) => s.id === params.skillId);
    if (!skill) throw notFound();
    return { skill };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.skill.name} — Skills` : "Skill" }],
  }),
  component: SkillEditor,
  notFoundComponent: () => (
    <div className="p-8 text-text-secondary">Skill not found.</div>
  ),
});

function SkillEditor() {
  const { skill } = Route.useLoaderData();
  const [text, setText] = useState(skill.instructions);
  const [sample, setSample] = useState("Topic: The Vajont Dam disaster 1963");
  const [output, setOutput] = useState(
    "S001: Picture a concrete wall standing at the edge of an alpine valley just before dawn.\n\nS002: The engineers called it impossible. And then they built it anyway.",
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/skills"
            className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> Skills
          </Link>
          <span className="text-text-tertiary">/</span>
          <div className="text-[15px] font-semibold">{skill.name}</div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-raised hover:bg-hover px-3 h-9 text-[13px]">
            Cancel
          </button>
          <button className="rounded-md bg-blue hover:bg-blue/90 text-white px-3 h-9 text-[13px] font-medium">
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface border border-subtle p-4">
          <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
            Instructions
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={22}
            className="w-full rounded-md bg-base border border-subtle p-3 font-mono text-[12px] leading-relaxed resize-none"
          />
          <div className="flex gap-2 mt-3">
            <select className="h-8 rounded-md bg-raised border border-subtle px-2 text-[13px]">
              <option>Category: {skill.category}</option>
            </select>
            <select className="h-8 rounded-md bg-raised border border-subtle px-2 text-[13px]">
              <option>Workflow mappings…</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-surface border border-subtle p-4">
          <div className="text-[11px] uppercase tracking-wide text-text-tertiary mb-2">
            Test
          </div>
          <label className="text-[11px] text-text-secondary">Sample input</label>
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={3}
            className="w-full mt-1 rounded-md bg-base border border-subtle p-2.5 text-[13px] resize-none"
          />
          <button
            onClick={() =>
              setOutput(
                (o) =>
                  `S001: ${sample.replace(/^Topic:\s*/, "")} unfolds against a horizon slowly bleeding red.\n\n${o}`,
              )
            }
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue hover:bg-blue/90 text-white px-3 h-8 text-[13px] font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            Run test
          </button>
          <label className="mt-4 block text-[11px] text-text-secondary">
            Output
          </label>
          <div className="mt-1 rounded-md bg-base border border-subtle p-2.5 font-mono text-[12px] whitespace-pre-wrap min-h-32 text-text-secondary">
            {output}
          </div>
          <div className="mt-2 text-[11px] text-text-tertiary">
            10 credits per test
          </div>
        </div>
      </div>
    </div>
  );
}
