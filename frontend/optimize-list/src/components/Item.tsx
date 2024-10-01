import { useState } from "react";
import { ItemData } from "../api/fetch-list";


type ItemProps = {
    item: ItemData;
    isSelected: boolean;
    onClick: () => void;
    };

function Item({ item, isSelected: initialSelection, onClick }: ItemProps) {
  const [isSelected, setSelected] = useState(initialSelection);

  return (
    // biome-ignore lint: no need for key event
    <li
      style={{ backgroundColor: isSelected ? 'yellow' : 'white', cursor: 'pointer'}}
      onClick={() => {
        setSelected((old) => !old);
        onClick();
      }}
    >
        ID {item.id} - {item.name}
    </li>
  );
}

export default Item;
