interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
    );
}

export function ContentCardSkeleton() {
    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
            <Skeleton className="aspect-video" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
    );
}

export function StatsCardSkeleton() {
    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="border-b border-slate-700/50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
            <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
        </tr>
    );
}

export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
    );
}
