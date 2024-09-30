// RegisterScreen.js
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebase/config'; // Asegúrate de que el camino es correcto
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { firestore } from '../firebase/config'; // Importa Firestore
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [isActive, setIsActive] = useState(false);
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    

    try {
      // Verificar se o email já está registrado
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setErrorMessage('Este e-mail já está registrado.');
        return;
      }

      // Verificar se o username já está registrado
      
      const q = query(collection(firestore, 'users'), where('username', '==', username));
    
      // Executa a consulta
      const querySnapshot = await getDocs(q);

      if(querySnapshot.empty){
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar informações ao Firestore incluindo o uid
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,  // Guardar o ID do usuário
        nome,
        username,
        email,
      });

      navigation.navigate('Perfil');
      }else{
        setErrorMessage('Este Nome de Usuario já esta em uso');
      }
      
      
    } catch (error) {
      setErrorMessage('Este E-mail já esta em uso');
    }

   
    
  };

  const checkEmailExists = async (email) => {
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return signInMethods.length > 0; // Retorna true se o e-mail já tiver métodos de login associados
    } catch (error) {
      setErrorMessage('Erro ao verificar o e-mail.');
      return false;
    }
  };

  const checkUsernameExists = async (username) => {
    try {
      const q = query(collection(firestore, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // Retorna true se encontrar algum usuário com esse username
    } catch (error) {
      setErrorMessage('Erro ao verificar o nome de usuário.');
      return false;
    }
  };

  function handleLogin() {
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 55, marginBottom: 40 }}>𝕐</Text>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Cadastre-se</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        keyboardType="default"
        autoCapitalize="words"
        placeholderTextColor={isActive ? '#aaa' : '#ccc'}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          if (nome === '') {
            setIsActive(false);
          }
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Nome de Usuário"
        value={username}
        onChangeText={setUsername}
        keyboardType="default"
        autoCapitalize="none"
        placeholderTextColor={isActive ? '#aaa' : '#ccc'}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          if (username === '') {
            setIsActive(false);
          }
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={isActive ? '#aaa' : '#ccc'}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          if (email === '') {
            setIsActive(false);
          }
        }}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={isActive ? '#aaa' : '#ccc'}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          if (password === '') {
            setIsActive(false);
          }
        }}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={{ color: '#FFF', fontSize: 19 }}>Cadastrar</Text>
      </TouchableOpacity>

      <Text style={styles.registerPrompt}>Já possui uma conta?</Text>
      <TouchableOpacity onPress={handleLogin}>
        <Text style={{ textDecorationLine: 'underline', color: 'blue' }}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '##f2f2f2',
    padding: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingLeft: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F5F8FA',
  },
  button: {
    width: '40%',
    height: 40,
    backgroundColor: '#1DA1F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 20,
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
