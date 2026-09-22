import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import MagicalBackground from '@/components/magical-background';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col overflow-hidden bg-primary p-10 text-primary-foreground lg:flex dark:border-r">
                <MagicalBackground />
                <div className="pointer-events-none absolute inset-0 opacity-90">
                    <div className="absolute -top-20 -right-16 size-72 rounded-full border-[32px] border-accent/30" />
                    <div className="absolute top-1/3 -left-16 size-48 rotate-12 rounded-[2rem] bg-highlight/25" />
                    <div className="absolute right-16 bottom-20 size-28 rotate-45 rounded-3xl border border-warning/50 bg-warning/20" />
                </div>
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-bold"
                >
                    <AppLogoIcon className="mr-2 size-8 fill-current text-primary-foreground" />
                    {name}
                </Link>
                <div className="relative z-20 mt-auto max-w-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary-foreground/70 uppercase">
                        <span className="size-2 rounded-full bg-success" />
                        Facility operations
                    </div>
                    <p className="text-3xl leading-tight font-semibold tracking-tight text-primary-foreground">
                        Clear records. Calm decisions.
                    </p>
                    <p className="max-w-xs text-sm leading-6 text-primary-foreground/75">
                        A focused workspace for every movement, chamber, and
                        case.
                    </p>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="animate-fade-in-up mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-primary sm:h-12" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-2xl font-bold text-foreground">
                            {title}
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
