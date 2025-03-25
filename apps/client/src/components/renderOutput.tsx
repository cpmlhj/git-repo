import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMark from 'react-markdown'
import { useEffect, useRef } from 'react'

export const StreamOutput = ({
	displayText,
	isCode,
	language = 'javascript'
}: {
	displayText: string
	isCode?: boolean
	language?: string
}) => {
	const contentRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (contentRef.current) {
			contentRef.current.scrollTop = contentRef.current.scrollHeight
		}
	}, [displayText])
	return isCode ? (
		<div
			ref={contentRef}
			className="h-[300px] overflow-y-auto bg-gray-50 rounded p-4 mb-4 transition-all duration-300 ease-in-out scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-500"
		>
			<SyntaxHighlighter language={language} style={materialLight}>
				{displayText}
			</SyntaxHighlighter>
		</div>
	) : (
		<div
			ref={contentRef}
			style={{ scrollbarWidth: 'none' }}
			className=" h-[300px] overflow-y-auto bg-gray-50 rounded p-4 mb-4 transition-all duration-300 ease-in-out scrollbar-none "
		>
			<ReactMark
				// className="prose prose-invert max-w-none"
				components={{
					h1: ({ children }) => (
						<h1 className="text-3xl font-bold mt-6 mb-4">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-2xl font-bold mt-5 mb-3">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-xl font-bold mt-4 mb-2">
							{children}
						</h3>
					),
					p: ({ children }) => (
						<p className="my-4 leading-7">{children}</p>
					),
					ul: ({ children }) => (
						<ul className="list-disc list-inside my-4 space-y-2">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="list-decimal list-inside my-4 space-y-2">
							{children}
						</ol>
					),
					li: ({ children }) => (
						<li className="ml-4">{children}</li>
					),
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic">
							{children}
						</blockquote>
					),
					code: ({ className, children }) => {
						const match = /language-(\w+)/.exec(
							className || ''
						)
						return match ? (
							<SyntaxHighlighter
								language={match[1]}
								style={materialLight}
							>
								{String(children)}
							</SyntaxHighlighter>
						) : (
							<code className="bg-lime-700 text-blue-50 rounded px-1 py-0.5">
								{children}
							</code>
						)
					}
				}}
			>
				{displayText}
			</ReactMark>
		</div>
	)
}
