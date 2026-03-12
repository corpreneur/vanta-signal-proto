interface CaseTagsProps {
  tags: string[];
}

const CaseTags = ({ tags }: CaseTagsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-vanta-text-low px-2.5 py-1 border border-vanta-border-mid"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

export default CaseTags;
