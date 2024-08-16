import React, { useState, useEffect } from "react";
import "./styles.css";

// Utility function to debounce API calls
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    if (timer) clearTimeout(timer); // Clear previous timer if any
    timer = setTimeout(() => fn(...args), delay); // Set new timer
  };
}

function App() {
  // State to store the current search term
  const [searchTerm, setSearchTerm] = useState("");
  // State to store suggestions from the API
  const [suggestions, setSuggestions] = useState([]);
  // State to store items in the shopping list
  const [shoppingList, setShoppingList] = useState([]);

  // Function to fetch suggestions from the API
  const fetchSuggestions = async (term) => {
    if (term.length < 2) return; // Only fetch if term length is 2 or more
    try {
      const response = await fetch(
        `https://api.frontendeval.com/fake/food/${term}`
      );
      const data = await response.json();
      setSuggestions(data); // Update suggestions state with fetched data
    } catch (error) {
      console.error("Error fetching suggestions:", error); // Handle errors
    }
  };

  // Create a debounced version of the fetchSuggestions function
  const debouncedFetchSuggestions = debounce(fetchSuggestions, 500);

  // Effect to call debouncedFetchSuggestions when searchTerm changes
  useEffect(() => {
    debouncedFetchSuggestions(searchTerm);
  }, [searchTerm]); // Dependency array: re-run effect when searchTerm changes

  // Handler for input change events
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update searchTerm state
  };

  // Handler to add an item to the shopping list
  const handleAddItem = (item) => {
    setShoppingList((prevList) => [
      ...prevList,
      { name: item, checked: false, quantity: 1 },
    ]);
    setSearchTerm(""); // Clear search input
    setSuggestions([]); // Clear suggestions
  };

  // Handler to toggle the checked state of an item
  const handleToggleItem = (index) => {
    setShoppingList((prevList) =>
      prevList.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Handler to delete an item from the shopping list
  const handleDeleteItem = (index) => {
    setShoppingList((prevList) => prevList.filter((_, i) => i !== index));
  };

  // Handler to change the quantity of an item
  const handleQuantityChange = (index, amount) => {
    setShoppingList((prevList) =>
      prevList.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(item.quantity + amount, 1) }
          : item
      )
    );
  };

  // Handler to reorder items in the list
  const moveItem = (index, direction) => {
    const newList = Array.from(shoppingList); // Create a copy of the list
    const [movedItem] = newList.splice(index, 1); // Remove item from its current position
    newList.splice(index + direction, 0, movedItem); // Insert item at the new position
    setShoppingList(newList); // Update shoppingList state with reordered list
  };

  return (
    <div className="App">
      <h1>Shopping List</h1>
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        suggestions={suggestions}
        onAddItem={handleAddItem}
      />
      <ul className="shopping-list">
        {shoppingList.map((item, index) => (
          <li key={index} className={item.checked ? "checked" : ""}>
            <button
              className="toggle-button"
              onClick={() => handleToggleItem(index)}
              aria-label={`Toggle ${item.name} ${
                item.checked ? "uncheck" : "check"
              }`}
            >
              {item.checked ? "✓" : "✓"}
            </button>
            <div className="item-container">
              <span
                onClick={() => handleToggleItem(index)}
                style={{
                  textDecoration: item.checked ? "line-through" : "none",
                }}
                aria-label={`Item: ${item.name}, quantity ${item.quantity}`}
              >
                {item.name}
              </span>
              <div className="quantity-controls">
                <button
                  onClick={() => handleQuantityChange(index, -1)}
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  readOnly
                  aria-label={`Quantity for ${item.name}`}
                />
                <button
                  onClick={() => handleQuantityChange(index, 1)}
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
            <div className="reorder-controls">
              <button
                className="reorder-button"
                disabled={index === 0}
                onClick={() => moveItem(index, -1)}
                aria-label={`Move ${item.name} up`}
              >
                ↑
              </button>
              <button
                className="reorder-button"
                disabled={index === shoppingList.length - 1}
                onClick={() => moveItem(index, 1)}
                aria-label={`Move ${item.name} down`}
              >
                ↓
              </button>
            </div>
            <button
              className="delete-button"
              onClick={() => handleDeleteItem(index)}
              aria-label={`Remove ${item.name}`}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchBar({ searchTerm, onSearchChange, suggestions, onAddItem }) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        setHighlightedIndex((prevIndex) =>
          Math.min(prevIndex + 1, suggestions.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (e.key === "Enter") {
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          onAddItem(suggestions[highlightedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [highlightedIndex, suggestions, onAddItem]);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search for items..."
        aria-label="Search for items"
      />
      {suggestions.length > 0 && (
        <div className="dropdown">
          <ul className="dropdown-list">
            {suggestions.map((item, index) => (
              <li
                key={index}
                className={index === highlightedIndex ? "highlighted" : ""}
                onMouseDown={() => onAddItem(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                aria-label={`Suggestion: ${item}`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
