import { useState, useEffect, useReducer, useCallback, useMemo } from "react";
import ItemList from "./components/ItemList";
import SearchBar from "./components/SearchBar";
import { fetchList, type ItemData } from "./api/fetch-list";
import "./App.css";

interface ItemsState {
  items: ItemData[];
  selectedItemIds: Set<number>;
  lastSelectedItemId?: number;
}

type ItemsAction = { type: "select"; id: number } | { type: "init"; items: ItemData[] };

const itemsStateReducer = (state: ItemsState, action: ItemsAction): ItemsState => {
  switch (action.type) {
    case "init": {
      return {
        items: action.items,
        selectedItemIds: new Set<number>(),
      };
    }
    case "select": {
      const id = action.id;
      const { selectedItemIds, lastSelectedItemId } = state;

      let newLastSelectedItemId = lastSelectedItemId;
      const newSelectedItemsIds = new Set(selectedItemIds);
      if (selectedItemIds.has(id)) {
        newSelectedItemsIds.delete(id);
      } else {
        newSelectedItemsIds.add(id);
        newLastSelectedItemId = id;
      }

      return {
        ...state,
        selectedItemIds: newSelectedItemsIds,
        lastSelectedItemId: newLastSelectedItemId,
      };
    }
  }
};

function App() {
  const [query, setQuery] = useState("");
  const [{ items, selectedItemIds, lastSelectedItemId }, dispatch] = useReducer(itemsStateReducer, {
    items: [],
    selectedItemIds: new Set<number>(),
    lastSelectedItem: null,
  });

  // Efficient toggle function for selection
  const toggleSelect = useCallback((id: number) => {
    dispatch({ type: "select", id });
  }, []);

  async function fetchData() {
    const data = await fetchList({ query });
    dispatch({ type: "init", items: data });
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // biome-ignore lint: selectedItemIds is not in dependencies on purpose, see OPTIMIZATIONS.md
  const MemoizedItemList = useMemo(() => {
    return <ItemList items={items} selectedItemIds={selectedItemIds} onSelectItem={toggleSelect} />;
    // eslint-disable-next-line
  }, [items, toggleSelect]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 500,
      }}
    >
      <h1>Item List</h1>
      <p>Total Items Selected: {selectedItemIds.size}</p>
      <p>Last selected item ID is: {lastSelectedItemId}</p>
      <SearchBar query={query} setQuery={setQuery} />
      {MemoizedItemList}
    </div>
  );
}

export default App;
