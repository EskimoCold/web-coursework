type Props = {
  source?: string;
  size: number;
  className?: string;
  style?: object;
};

export const Icon: React.FC<Props> = ({ source, size, className, style }: Props) => {
  const _style = {
    width: `${size}px`,
    height: `${size}px`,
    ...style,
  };

  return <img src={source ? source : 'sample.png'} className={className} style={_style} />;
};
