import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "./firebase.js";
import { auth, provider, signInWithPopup, signOut, AI_API_KEY, AI_API_URL } from "./firebase.js"; 

// Load recipes immediately on page load
document.addEventListener("DOMContentLoaded", () => {
    renderRecipes();
    updateUI(false); 
});

// Login Function
document.getElementById("login-btn").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        localStorage.setItem("email", JSON.stringify(result.user.email));
        console.log("User signed in:", result.user.email);
        updateUI(true);
        renderRecipes(); 
    } catch (error) {
        console.error("Error during login:", error);
    }
});

// Logout Function
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        localStorage.removeItem("email");
        console.log("User signed out");
        updateUI(false);
        renderRecipes(); 
    }).catch(error => console.error("Error during logout:", error));
});

// Update UI Based on Login State
function updateUI(isLoggedIn) {
    document.getElementById("login-btn").style.display = isLoggedIn ? "none" : "inline-block";
    document.getElementById("logout-btn").style.display = isLoggedIn ? "inline-block" : "none";
}

// Function to Save Recipes to Firestore (requires login)
async function addRecipeToFirestore(name, ingredients, category) {
    const email = JSON.parse(localStorage.getItem("email"));
    if (!email) {
        alert("You must be logged in to add recipes!");
        return;
    }

    try {
        await addDoc(collection(db, "recipes"), {
            email: email,
            name: name,
            ingredients: ingredients.split(",").map(i => i.trim()),
            category: category
        });

        console.log("Recipe added successfully!");
        renderRecipes();
    } catch (error) {
        console.error("Error adding recipe:", error);
    }
}

// Function to Retrieve and Display Recipes
async function renderRecipes() {
    const email = JSON.parse(localStorage.getItem("email"));
    const recipesList = document.getElementById("recipes");
    recipesList.innerHTML = "";

    try {
        let q;
        if (email) {
            // Show only logged-in user's recipes
            q = query(collection(db, "recipes"), where("email", "==", email));
        } else {
            // Show all recipes 
            q = collection(db, "recipes");
        }

        const data = await getDocs(q);

        data.forEach((docSnap) => {
            const recipe = docSnap.data();
            const recipeId = docSnap.id;

            const li = document.createElement("li");
            li.innerHTML = `<strong>${recipe.name}</strong> - ${recipe.ingredients.join(", ")} (${recipe.category})`;

            // Favorite Button
            const favoriteBtn = document.createElement("button");
            favoriteBtn.textContent = "★";
            favoriteBtn.addEventListener("click", () => toggleFavorite(recipeId, recipe.name));

            // Edit Button (only visible if logged in)
            if (email) {
                const editBtn = document.createElement("button");
                editBtn.textContent = "Edit";
                editBtn.addEventListener("click", () => editRecipe(recipeId, recipe.name, recipe.ingredients.join(", "), recipe.category));
                li.appendChild(editBtn);
            }

            // Delete Button (only visible if logged in)
            if (email) {
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.addEventListener("click", () => deleteRecipe(recipeId));
                li.appendChild(deleteBtn);
            }

            li.appendChild(favoriteBtn);
            recipesList.appendChild(li);
        });

    } catch (error) {
        console.error("Error loading recipes:", error);
    }
}

// Function to Delete a Recipe from Firestore
async function deleteRecipe(recipeId) {
    if (confirm("Are you sure you want to delete this recipe?")) {
        try {
            await deleteDoc(doc(db, "recipes", recipeId));
            console.log("Recipe deleted successfully!");
            renderRecipes();
        } catch (error) {
            console.error("Error deleting recipe:", error);
        }
    }
}

// Function to Edit a Recipe
async function editRecipe(recipeId, currentName, currentIngredients, currentCategory) {
    const newName = prompt("Enter new recipe name:", currentName);
    const newIngredients = prompt("Enter new ingredients (comma-separated):", currentIngredients);
    const newCategory = prompt("Enter new category:", currentCategory);

    if (newName && newIngredients) {
        try {
            await updateDoc(doc(db, "recipes", recipeId), {
                name: newName,
                ingredients: newIngredients.split(",").map(i => i.trim()),
                category: newCategory
            });
            console.log("Recipe updated successfully!");
            renderRecipes();
        } catch (error) {
            console.error("Error updating recipe:", error);
        }
    } else {
        alert("Recipe name and ingredients cannot be empty!");
    }
}

// Function to Mark Favorite Recipes
function toggleFavorite(recipeId, recipeName) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.includes(recipeId)) {
        favorites = favorites.filter(id => id !== recipeId);
    } else {
        favorites.push(recipeId);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(`${recipeName} has been ${favorites.includes(recipeId) ? "added to" : "removed from"} favorites!`);
}

// AI Chatbot Functionality
async function getAIResponse(userInput) {
    const requestBody = {
        contents: [{ parts: [{ text: `You are an AI assistant for a Recipe Organizer app. Answer questions about its functionality and provide suggestions. Question: ${userInput}` }] }]
    };

    try {
        const response = await fetch(`${AI_API_URL}?key=${AI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't answer that.";
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "Error fetching response.";
    }
}

// Handle User Input in Chatbot
document.getElementById("chat-send").addEventListener("click", async () => {
    const userInput = document.getElementById("chat-input").value.trim();
    if (!userInput) return;

    const aiResponse = await getAIResponse(userInput);
    document.getElementById("chat-messages").innerHTML += `<p><strong>You:</strong> ${userInput}</p><p><strong>AI:</strong> ${aiResponse}</p>`;
});

// Load Recipes and UI on Page Load
document.addEventListener("DOMContentLoaded", renderRecipes);