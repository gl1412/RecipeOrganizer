import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "./firebase.js";
import { auth, provider, signInWithPopup, signOut, AI_API_KEY, AI_API_URL } from "./firebase.js"; // Import authentication functions


// 🔹 Login Function (Google Sign-In)
document.getElementById("login-btn").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        localStorage.setItem("email", JSON.stringify(result.user.email));
        console.log("User signed in:", result.user.email);
        updateUI();
    } catch (error) {
        console.error("Error during login:", error);
    }
});

// 🔹 Logout Function
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        localStorage.removeItem("email");
        console.log("User signed out");
        updateUI();
    }).catch(error => console.error("Error during logout:", error));
});

// Function to Save Recipes to Firestore
async function addRecipeToFirestore(name, ingredients, category) {
    const email = JSON.parse(localStorage.getItem("email")); // Get user email
    if (!email) {
        alert("You must be logged in to add recipes!");
        return;
    }

    try {
        await addDoc(collection(db, "recipes"), {
            email: email,
            name: name,
            ingredients: ingredients.split(",").map(i => i.trim()), // Convert string to array
            category: category
        });

        console.log("Recipe added successfully!");
        renderRecipes();
    } catch (error) {
        console.error("Error adding recipe:", error);
    }
}

// Function to Retrieve and Display Recipes from Firestore
async function renderRecipes() {
    const email = JSON.parse(localStorage.getItem("email")); // Get user email
    if (!email) return;

    const q = query(collection(db, "recipes"), where("email", "==", email));
    const data = await getDocs(q);
    const recipesList = document.getElementById("recipes");
    recipesList.innerHTML = ""; // Clear list before rendering

    data.forEach((docSnap) => {
        const recipe = docSnap.data();
        const recipeId = docSnap.id;

        const li = document.createElement("li");
        li.innerHTML = `<strong>${recipe.name}</strong> - ${recipe.ingredients.join(", ")} (${recipe.category})`;

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editRecipe(recipeId, recipe.name, recipe.ingredients.join(", "), recipe.category));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteRecipe(recipeId));

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        recipesList.appendChild(li);
    });
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

// Event Listener for "Add Recipe" Button
document.getElementById("add-recipe").addEventListener("click", () => {
    const name = document.getElementById("recipe-name").value.trim();
    const ingredients = document.getElementById("recipe-ingredients").value.trim();
    const category = document.getElementById("recipe-category").value;

    if (name && ingredients) {
        addRecipeToFirestore(name, ingredients, category);
        document.getElementById("recipe-name").value = "";
        document.getElementById("recipe-ingredients").value = "";
    } else {
        alert("Please enter a recipe name and ingredients.");
    }
});

// 🔹 AI Chatbot Functionality
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
        if (data.candidates && data.candidates.length > 0) {
            let aiText = data.candidates[0].content.parts[0].text;
            aiText = aiText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
            return aiText;
        } else {
            return "<strong>Sorry!</strong> I couldn't answer that. Try a different question!";
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "<strong>Error fetching response.</strong> Please try again.";
    }
}

// Handle User Input in Chatbot
document.getElementById("chat-send").addEventListener("click", async () => {
    const userInput = document.getElementById("chat-input").value.trim();
    if (!userInput) return;

    addMessageToChatbox("You", userInput);
    document.getElementById("chat-input").value = "Thinking...";

    const aiResponse = await getAIResponse(userInput);
    document.getElementById("chat-input").value = "";
    addMessageToChatbox("AI", aiResponse);
});

// Load Recipes and UI on Page Load
document.addEventListener("DOMContentLoaded", updateUI);