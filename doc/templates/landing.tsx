import { AsideNav } from "./site";

// Layout
export const Layout = (props: { children: React.ReactNode }) => {
    return (
        <main className="landing-page">
            <AsideNav>{""}</AsideNav>
            <article>{props.children}</article>
        </main>
    );
};
