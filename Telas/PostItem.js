import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, getDocs, doc, getDoc, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';


const PostItem = ({ texto, img, autor, id, userId, dell }) => {
  const navigation = useNavigation();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0); // Novo estado para contar comentários
  const [modalVisible, setModalVisible] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [optionDell, setOptionDell] = useState(false);

  useEffect(() => {
    const fetchLikesAndCommentsCount = async () => {
      try {
        const likesRef = collection(firestore, 'posts', id, 'likes');
        const likesSnapshot = await getDocs(likesRef);
        const userLiked = likesSnapshot.docs.some(doc => doc.id === userId);
        setLiked(userLiked);
        setLikesCount(likesSnapshot.size);

        // Contagem de comentários
        const commentsRef = collection(firestore, 'posts', id, 'comentarios');
        const commentsSnapshot = await getDocs(commentsRef);
        setCommentsCount(commentsSnapshot.size); // Atualiza a contagem de comentários

        if (dell) {
          setOptionDell(true);
        }
      } catch (error) {
        console.error("Erro ao buscar likes e comentários: ", error);
      }
    };

    fetchLikesAndCommentsCount();
  }, [id, userId]);

  const openCommentModal = async () => {
    setModalVisible(true);
    await fetchComments(id); // Carregar os comentários ao abrir o modal
  };

  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(collection(firestore, 'posts', postId, 'comentarios'), orderBy('data', 'desc'));
      const commentSnapshot = await getDocs(commentsQuery);

      const commentsList = await Promise.all(
        commentSnapshot.docs.map(async (commentDoc) => {
          const commentData = { id: commentDoc.id, ...commentDoc.data() };

          if (commentData.userId) {
            const userDocRef = doc(firestore, 'users', commentData.userId);
            const userDoc = await getDoc(userDocRef);
            commentData.autor = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
          } else {
            commentData.autor = null;
          }

          return commentData;
        })
      );

      setComments(commentsList);
    } catch (error) {
      console.error("Erro ao buscar comentários: ", error);
    }
  };

  const handleSendComment = async () => {
    if (commentText.trim() === '') return;

    try {
      await addDoc(collection(firestore, 'posts', id, 'comentarios'), {
        postId: id,
        userId: userId,
        texto: commentText,
        data: new Date(),
      });
      setCommentText('');
      fetchComments(id); // Atualiza a lista de comentários
    } catch (error) {
      console.error("Erro ao enviar comentário: ", error);
    }
  };

  const dellPost = async () => {
    try {
      // Deleta o post no Firestore pelo ID
      await deleteDoc(doc(firestore, 'posts', id));

      navigation.replace(navigation.getState().routes[navigation.getState().index].name);

    } catch (error) {
      console.error("Erro ao deletar post: ", error);
      alert('Erro ao deletar o post.');
    }
  };

  const handleLike = async () => {
    if (!userId) {
      navigation.navigate('Person');// Redireciona para a página de login
      return; // Sai da função se o usuário não estiver logado
    }

    try {
      const likesRef = collection(firestore, 'posts', id, 'likes');

      if (liked) {
        // Se já está curtido, descurte
        const userLikeDoc = doc(likesRef, userId);
        await deleteDoc(userLikeDoc);
        setLiked(false);
        setLikesCount(prevCount => prevCount - 1); // Atualiza contagem de likes
      } else {
        // Se não está curtido, curte
        await setDoc(doc(likesRef, userId), { userId });
        setLiked(true);
        setLikesCount(prevCount => prevCount + 1); // Atualiza contagem de likes
      }
    } catch (error) {
      console.error("Erro ao lidar com likes: ", error);
    }
  };

  const handleShare = async () => {
    const shareOptions = {
      message: texto, // Mensagem que você deseja compartilhar
      url: img, // URL da imagem (se houver)
    };

    try {
      await Sharing.shareAsync(shareOptions.url, {
        dialogTitle: "Compartilhar Post",
        UTI: 'public.image', // Defina o tipo de arquivo, se necessário
      });
    } catch (error) {
      console.error("Erro ao compartilhar: ", error);
    }
  };


  return (
    <View style={{ borderColor: "#dedede", borderBottomWidth: 1, paddingVertical: 5, backgroundColor: '#FFF' }}>

      <View style={{}}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => navigation.navigate('Usuario', { userId: autor?.id })}>
          <Image
            source={{ uri: autor?.perfil || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkMMAxb6dOJG5OxyqQi0Oas3lh4RTgDhq8pg&s' }}
            style={{ width: 40, height: 40, borderRadius: 25, marginRight: 10, margin: 5 }}
          />
          <Text style={{ fontWeight: 'bold' }}>{autor?.nome || 'Unknown'}</Text>

        </TouchableOpacity>
        {optionDell && <TouchableOpacity onPress={dellPost} style={{ position: 'absolute', right: 20, }}><Text style={{ fontWeight: 'bold', color: 'red', fontSize: 20 }}>X</Text></TouchableOpacity>}

      </View>

      <Text style={{ paddingLeft: 48 }}>{texto}</Text>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        {img && img.length > 0 && (
          <Image
            source={{ uri: img }}
            style={{ width: '95%', height: 260, borderRadius: 5, marginTop: 5 }}
          />
        )}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 11 }}>
        <TouchableOpacity onPress={openCommentModal}>
          <Ionicons name="chatbubble-outline" size={22} color="black" />
          {commentsCount > 0 && <Text style={{ textAlign: 'center' }}>{commentsCount}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLike}>
          <Ionicons name="heart-outline" size={22} color={liked ? "red" : "black"} />
          {likesCount > 0 && <Text style={{ textAlign: 'center' }}>{likesCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="arrow-redo-outline" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* Modal de comentários */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          setComments([]);
        }}
      >
        <View style={{
          backgroundColor: '#FFF', height: '75%', width: '100%', position: 'absolute', bottom: 0,
          borderTopRightRadius: 20, borderTopLeftRadius: 20, elevation: 2, boxShadow: "0px -4px 5px rgba(34, 34, 34, 0.5)"
        }}>
          <TouchableOpacity onPress={() => { setModalVisible(false); setComments([]); }}>
            <Text style={{ textAlign: 'center' }}>Fechar</Text>
          </TouchableOpacity>
          <ScrollView style={{ marginHorizontal: 10, marginTop: 15 }}>
            {comments.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Nenhum comentário ainda.</Text>
            ) : (
              comments.map(comment => (
                <View key={comment.id} style={{ marginVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={{ uri: comment.autor.perfil ? comment.autor.perfil  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkMMAxb6dOJG5OxyqQi0Oas3lh4RTgDhq8pg&s'}} style={{ width: 30, height: 30, borderRadius: 15 }} />
                  <Text style={{ fontWeight: 'bold', marginLeft: 5 }}>{comment.autor?.nome || 'Unknown'}:</Text>
                  <Text style={{ marginLeft: 5 }}>{comment.texto}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={{
            flexDirection: 'row', alignItems: 'center', borderTopWidth: 1,
            borderTopColor: '#dedede', paddingHorizontal: 10, paddingVertical: 10
          }}>
            <TextInput
              style={{
                flex: 1,
                height: 40,
                backgroundColor: '#f2f2f2',
                borderRadius: 20,
                paddingHorizontal: 15,
                marginRight: 10,
                fontSize: 14,
              }}
              placeholder="Adicione um comentário..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity onPress={handleSendComment}>
              <Ionicons name="send-outline" size={24} color="#3b5998" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostItem;
