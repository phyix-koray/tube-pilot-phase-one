import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Agent Team canvas'ında (React Flow tabanlı) çalışma zamanında bir hata
 * oluşursa, sessizce beyaz/boş bir sayfa göstermek yerine hatayı görünür
 * kılar. Bu, ileride benzer bir sorun tekrar çıkarsa teşhisi saniyeler
 * içinde mümkün kılmak için var.
 */
export class AgentTeamErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[AgentTeamCanvas crashed]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <Link to="/agent-teams" className="text-blue hover:underline text-[13px]">
            ← All teams
          </Link>
          <h1 className="text-[18px] font-semibold mt-4 text-red">
            Agent Team canvas'ı yüklenirken bir hata oluştu
          </h1>
          <pre className="mt-3 text-[12px] whitespace-pre-wrap rounded-lg bg-raised border border-subtle p-3 text-text-secondary">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
