import { AsideNav, NavLink } from "./site";

// Layout
export const Layout = (props: { children: React.ReactNode }) => {
    return (
        <main className="api-doc">
            <AsideNav>
                <ApiRefNavigation />
            </AsideNav>
            <article>{props.children}</article>
        </main>
    );
};

export const ApiRefNavigation = () => {
    return (
        <>
            <ApiRefNavList>
                <NavLink dir="/references/prelude" text="Prelude" />
                <NavLink dir="/references/primitives" text="Primitives" />
                <NavLink dir="/references/font-io" text="FontIo" />
                <NavLink dir="/references/rectify" text="Rectify" />
                <NavLink dir="/references/trace" text="Trace" />
                <NavLink dir="/references/cli-proc" text="CliProc" />
            </ApiRefNavList>
            <h4>Ot</h4>
            <ApiRefNavList>
                <NavLink dir="/references/ot/sfnt" text="Ot.Sfnt" />
                <NavLink dir="/references/ot/font" text="Ot.Font" />
                <NavLink dir="/references/ot/var" text="Ot.Var" />
                <NavLink dir="/references/ot/glyph" text="Ot.Glyph" />
                <NavLink dir="/references/ot/head" text="Ot.Head" />
                <NavLink dir="/references/ot/fvar" text="Ot.Fvar" />
                <NavLink dir="/references/ot/maxp" text="Ot.Maxp" />
                <NavLink dir="/references/ot/post" text="Ot.Post" />
                <NavLink dir="/references/ot/os2" text="Ot.Os2" />
                <NavLink dir="/references/ot/metric-head" text="Ot.MetricHead" />
                <NavLink dir="/references/ot/avar" text="Ot.Avar" />
                <NavLink dir="/references/ot/gasp" text="Ot.Gasp" />
                <NavLink dir="/references/ot/vdmx" text="Ot.Vdmx" />
                <NavLink dir="/references/ot/cff" text="Ot.Cff" />
                <NavLink dir="/references/ot/fpgm" text="Ot.Fpgm" />
                <NavLink dir="/references/ot/prep" text="Ot.Prep" />
                <NavLink dir="/references/ot/cvt" text="Ot.Cvt" />
                <NavLink dir="/references/ot/cmap" text="Ot.Cmap" />
                <NavLink dir="/references/ot/name" text="Ot.Name" />
                <NavLink dir="/references/ot/stat" text="Ot.Stat" />
                <NavLink dir="/references/ot/meta" text="Ot.Meta" />
                <NavLink dir="/references/ot/gdef" text="Ot.Gdef" />
                <NavLink dir="/references/ot/base" text="Ot.Base" />
                <NavLink dir="/references/ot/gsub-gpos" text="Ot.Gsub + Ot.Gpos" />
            </ApiRefNavList>
        </>
    );
};
const ApiRefNavList = (props: { children: React.ReactNode }) => (
    <ul className="nav-list api-ref-nav-list">{props.children}</ul>
);
