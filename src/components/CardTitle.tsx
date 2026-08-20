import InfoIcon from "./InfoIcon";

export default function CardTitle({ title, info }: { title: string; info: string }) {
  return (
    <div className="card-title-line">
      <h2>{title}</h2>
      <InfoIcon text={info} />
    </div>
  );
}