import React from "react";

const PRISTINE = "PRISTINE";
const PENDING = "PENDING";
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";

const CocktailNoInfoAvailable = () => {
  return <div>No data is available</div>;
};

const CocktailError = () => {
  return <div>The service is not responding at the moment</div>;
};

const CocktailRecipe = ({ drinks }) => {
  return drinks.map(drink => {
    return (
      <section key={drink.strDrink}>
        <h3>{drink.strDrink}</h3>
        <div>glass: {drink.strGlass}</div>
        <div>instructions: {drink.strInstructions}</div>
        <img src={drink.strDrinkThumb} alt={drink.strDrink} />
      </section>
    );
  });
};

const DisplayCocktailInfos = ({ status, data }) => {
  if (status === SUCCESS && data && data.drinks) {
    const { drinks } = data;
    return <CocktailRecipe drinks={drinks} />;
  }
  if (status === ERROR) {
    return <CocktailError />;
  }
  return <CocktailNoInfoAvailable />;
};

export { DisplayCocktailInfos };
