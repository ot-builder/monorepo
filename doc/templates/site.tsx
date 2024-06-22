import { NextRouter, withRouter } from "next/router";

export const AsideNav = (props: { children: React.ReactNode }) => (
    <aside className="side">
        <section className="site-nav">
            <h1>
                <a className="nav-link" href="/index">
                    ot-builder
                </a>
            </h1>
            <ul className="nav-list">
                <NavLink dir="/tutorial/intro" href="/tutorial/intro" text="Introduction" />
                <NavLink dir="/references" href="/references" text="API Reference" />
                <NavLink href="https://github.com/ot-builder/monorepo" text="Repository" />
            </ul>
        </section>
        <section className="function-nav">{props.children}</section>
    </aside>
);

export const NavLink = withRouter(
    (props: {
        router: NextRouter;
        dir?: string;
        href?: string;
        text: string;
        children?: React.ReactNode;
    }) => {
        const cl = !props.dir
            ? "fixed"
            : props.router.pathname.slice(0, props.dir.length) === props.dir
              ? "dynamic current"
              : "dynamic other";
        return (
            <li className={"nav-link " + cl}>
                <a className="link-item" href={props.href || props.dir}>
                    {props.text}
                </a>
                {props.children}
            </li>
        );
    }
);
