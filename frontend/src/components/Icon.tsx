type Props = {
    source?: string,
    size: number,
    className?: string 
}

export const Icon: React.FC<Props> = ({source, size, className}: Props) => {

    const style = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${size}px`,
    };

    return (<img src={source ? source : 'sample.png'} className={className} style={style}/>);
}