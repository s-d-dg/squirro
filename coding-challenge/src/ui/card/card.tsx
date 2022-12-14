import classes from "./card.module.css";

const Card = (props: any) => {
  return (
    <div data-id="card" className={classes.card}>
      {props.children}
    </div>
  );
};

export default Card;
