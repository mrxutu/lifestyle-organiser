import { parseMethodBlocks } from '@/lib/method-format'

export function MethodView({ method }: { method: string }) {
  const blocks = parseMethodBlocks(method)

  return (
    <div className="flex flex-col gap-3 text-sm">
      {blocks.map((block, index) =>
        block.type === 'list' ? (
          <ol key={index} className="list-decimal space-y-2 pl-6 marker:font-medium">
            {block.items.map((item) => (
              <li key={item.n} value={item.n} className="pl-1">
                {item.text}
              </li>
            ))}
          </ol>
        ) : (
          <p key={index} className="whitespace-pre-wrap">
            {block.lines.join(' ')}
          </p>
        )
      )}
    </div>
  )
}
