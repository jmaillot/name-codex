import { tl } from "../lib/i18n-utils";
import CardTitle from "./CardTitle";

type FavoritesCardProps = { favorites: string[]; onClearFavorites: () => void };

export default function FavoritesCard({ favorites, onClearFavorites }: FavoritesCardProps) {
  return (
    <details className="glass-card history-card">
      <summary className="azure-summary">
        <CardTitle title={tl("ui.favorites", "Favorites")} info={tl("ui.favoritesInfo", "Locally saved favorite generated names.")} />
        <span className="summary-actions">
          <button
            type="button"
            className="text-button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClearFavorites();
            }}
          >
            {tl("ui.clear", "Clear")}
          </button>
          <span className="summary-chevron">⌄</span>
        </span>
      </summary>
      {favorites.length === 0 ? <p className="section-note">{tl("ui.noFavorites", "No favorites yet.")}</p> : <ul>{favorites.map((item) => <li key={item}>{item}</li>)}</ul>}
    </details>
  );
}