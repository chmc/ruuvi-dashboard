import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const RuuviCard = ({ mac, ruuviData }) => {
    return (
        <Card key={mac}>
            <CardContent>
                <Typography variant='h5' component='div'>
                    {mac}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Temp: {Math.round(ruuviData.temperature * 100) / 100}c<br />
                    Humidity: {Math.round(ruuviData.humidity)}%<br />
                    Pressure: {Math.round(ruuviData.pressure)}p
                </Typography>
            </CardContent>
        </Card>
    )
}

export default RuuviCard