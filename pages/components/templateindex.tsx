import React from "react";
import TemplatePreview from "../components/templatepreview";
import { dummyData } from "../lib/dummy";
import { getAllTemplates, renderTemplate } from "../lib/templateRegistry";

type Props = {
  selectedTemplate: string | null;
  onSelect: (id: string) => void;
};

export default function TemplatesIndex({ selectedTemplate, onSelect }: Props) {
  const templates = getAllTemplates();

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center w-auto">
        {templates.map((template) => (
          <TemplatePreview
            key={template.id}
            id={template.id}
            title={template.name}
            description={template.description}
            features={template.features}
            category={template.category}
            selected={selectedTemplate === template.id}
            onSelect={onSelect}
          >
            {renderTemplate(template.id, dummyData)}
          </TemplatePreview>
        ))}
      </div>
    </div>
  );
}

