# Optimizations Done

1. Replaced multiple useState() with a single useReducer()
Multiple changes, may trigger multiple rerenders. Changing all the
variables in one pass, eventually will require only 1 re-render.

2. When using the search box, i've implemented a debounce functionality
inside the `useEffect()` hook. It would avoid searching on every key press.

3. Changed the type of selectedItemIds from `number[]` to `Set<number>` as
`Set.has()` is more efficient than `Array.includes()`.

4. Wrap the onSelect handler in useCallback. It creates a memoized function
and prevents re-rendering.

5. Memoized the whole ItemList in the App.

What we know about ItemList is that it depends on:
- items
- selected items
- the function that changes the selected

When we change the `items` it is absolute normal to require re-render.

The function to change selection is already memoized in (4), so it will not
unnecessary re-renders.

The only thing that still forces re-render of the whole list is the selected items.
In order to eliminate it:
- memoization excludes the selected items as dependency
- instead it is considered as initial selection
- and the `Item` component is updated to manage the state itself. So when it
  is clicked, it will re-render just the current component.
- in the `App` component, the `toggleSelect()` function will change
  `selectedItemIds`, `lastSelectedItemId` and that will trigger update of the labels.
  But `ItemList` will not be re-rendered.

----
# What couldn't be optimized without changes in functionality?

Loading significant portion of data is not user-friendly. It would be way
better if functionality is changed to use paging, lazy loading
mechanism, or virtualization.

This where libraries like react-virtualized, react-window,
react-infinite-scroller, react-viewport-list can help a lot.

I would also suggest adding a loading or progress indicator, along with
Skeleton (https://mui.com/material-ui/react-skeleton/)

If the frontent is used on Next.js, we can also use <Suspence> feature.


# Bugs Fixed

- **Fix Bug #1:** The "Last selected item ID" displays the incorrect ID. Ensure
that the correct ID is shown when an item is clicked.

I've changed the behavior to show the ID of the item, that was last selected.

- **Fix Bug #2:** There is a noticeable delay between selecting an item and
seeing the "Total Items Selected" and the highlighted item indicator.
Optimize this process so that the display updates immediately upon selection.

This has been fixed as part of the optimization process, by removing complete
re-render of the list.
