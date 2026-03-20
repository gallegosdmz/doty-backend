import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  validationCode: string;
}

export const VerificationEmail = ({
  validationCode,
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Tu código de verificación de Doty es {validationCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Doty</Heading>
          <Text style={text}>
            Hola, usa el siguiente código para seguir configurando tu cuenta.
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{validationCode}</Text>
          </Section>
          <Text style={text}>
            Si no solicitaste este código, puedes ignorar este correo de forma segura.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  marginTop: '40px',
  marginBottom: '40px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const h1 = {
  color: '#dc2626', // Tailwind red-600
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
};

const codeContainer = {
  background: '#f3f4f6', // Tailwind gray-100
  borderRadius: '8px',
  margin: '20px auto',
  padding: '20px',
  width: '100%',
  border: '1px solid #e5e7eb', // Tailwind gray-200
  maxWidth: '200px',
};

const code = {
  color: '#000',
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '4px',
  textAlign: 'center' as const,
  margin: '0',
};
