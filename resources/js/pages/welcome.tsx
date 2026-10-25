import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardList,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth, name } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    return (
        <>
            <Head title="Welcome" />

            <div className="flex min-h-svh flex-col bg-background text-foreground">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                    <Link
                        href={isAuthenticated ? dashboard() : login()}
                        className="flex items-center gap-3"
                    >
                        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-6 fill-current" />
                        </span>
                        <span className="text-sm font-semibold tracking-tight">
                            {name}
                        </span>
                    </Link>

                    <Button variant="outline" asChild>
                        <Link href={isAuthenticated ? dashboard() : login()}>
                            {isAuthenticated ? 'Open workspace' : 'Sign in'}
                        </Link>
                    </Button>
                </header>

                <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-20">
                    <section className="max-w-xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                            <Activity className="size-3.5" aria-hidden="true" />
                            Mortuary operations workspace
                        </div>

                        <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
                            Clear records.
                            <span className="block text-primary">
                                Calm decisions.
                            </span>
                        </h1>
                        <p className="mt-5 max-w-lg text-base leading-7 text-pretty text-muted-foreground">
                            Keep each case, chamber movement, and release
                            connected in one dependable workspace for your
                            facility.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button asChild size="lg">
                                <Link
                                    href={
                                        isAuthenticated ? dashboard() : login()
                                    }
                                >
                                    {isAuthenticated
                                        ? 'Go to dashboard'
                                        : 'Sign in to continue'}
                                </Link>
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Built for careful, traceable operations
                            </span>
                        </div>

                        <div className="mt-12 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <ClipboardList
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Case records
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Complete, connected histories
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                                    <ArrowDownToLine
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Chamber flow
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Clear capacity and placement
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-highlight/10 text-highlight">
                                    <ArrowUpFromLine
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Traceable releases
                                    </h2>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Every handoff accounted for
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-lg border border-border bg-card p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                                    One connected workflow
                                </p>
                                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                                    From admission to release
                                </h2>
                            </div>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <Activity
                                    className="size-5"
                                    aria-hidden="true"
                                />
                            </span>
                        </div>

                        <ol className="mt-8 space-y-0">
                            <li className="relative flex gap-4 pb-7">
                                <span className="absolute top-8 left-4 h-full w-px bg-border" />
                                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    1
                                </span>
                                <div className="pt-1">
                                    <h3 className="text-sm font-semibold">
                                        Register the case
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Capture identity and service details
                                        once, at intake.
                                    </p>
                                </div>
                            </li>
                            <li className="relative flex gap-4 pb-7">
                                <span className="absolute top-8 left-4 h-full w-px bg-border" />
                                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-info/10 text-sm font-semibold text-info">
                                    2
                                </span>
                                <div className="pt-1">
                                    <h3 className="text-sm font-semibold">
                                        Track every movement
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Keep chamber allocation and transfers
                                        visible.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-semibold text-success">
                                    3
                                </span>
                                <div className="pt-1">
                                    <h3 className="text-sm font-semibold">
                                        Complete the release
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Preserve a clear record through
                                        handover.
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </aside>
                </main>
            </div>
        </>
    );
}
