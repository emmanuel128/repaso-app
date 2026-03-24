import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={["markdown-content", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
          code: ({ node: _node, className: codeClassName, ...props }) => <code className={codeClassName} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
