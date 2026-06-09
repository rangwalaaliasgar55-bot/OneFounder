interface PageHeaderProps {
  icon: string
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ icon, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{description}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
